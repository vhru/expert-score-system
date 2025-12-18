import { dbOperations } from './database-adapter';

export interface ReviewAssignment {
  id: number;
  file_id: number;
  expert_id: number;
  assignment_status: 'assigned' | 'in_progress' | 'completed';
  score?: number;
  comments?: string;
  created_at: Date;
  updated_at: Date;
}

export async function assignReviewsToExperts(): Promise<{ success: boolean; message: string; assignments: any[]; statistics?: { totalAssignments: number; assignedTeams: number; totalTeams: number; skippedTeams: number; unassignedTeams?: number }; skippedTeams?: Array<{ team_id: number; team_name: string; reason: string }>; unassignedTeams?: Array<{ team_id: number; team_name: string; reason: string }> }> {
  try {
    // 获取所有团队
    const allTeams = await dbOperations.teams.findAll() as any[];
    const teams = allTeams.filter(t => t.status === 'active' && t.audit_status === 'approved');

    // 获取所有专家
    const allUsers = await dbOperations.users.findAll() as any[];
    const experts = allUsers.filter(u => u.role === 'expert');

    if (teams.length === 0) {
      return { success: false, message: '没有待分配的团队', assignments: [] };
    }

    if (experts.length < 2) {
      return { success: false, message: '专家数量不足，至少需要2个专家', assignments: [] };
    }

    // 清空所有现有分配记录，重新从零分配
    console.log('🗑️ 清空所有现有分配记录...');
    try {
      // 直接使用SQL清空所有分配记录（更高效、更彻底）
      // 通过数据库适配器执行原始SQL
      const dbAdapter = await import('@/lib/database-adapter');
      
      // 检查数据库类型并执行相应的清空操作
      if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD) {
        // MySQL: 直接执行DELETE
        const mysql = await import('mysql2/promise');
        const pool = mysql.createPool({
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '3306'),
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME || 'expert_review',
        });
        const [result] = await pool.execute('DELETE FROM review_assignments');
        await pool.end();
        console.log(`✅ 已清空所有分配记录 (MySQL affectedRows: ${(result as any).affectedRows})`);
      } else {
        // SQLite: 直接执行DELETE
        const db = (await import('@/lib/simple-sqlite')).default;
        await new Promise<void>((resolve, reject) => {
          db.run('DELETE FROM review_assignments', function(err) {
            if (err) reject(err);
            else {
              console.log(`✅ 已清空所有分配记录 (SQLite changes: ${this.changes})`);
              resolve();
            }
          });
        });
      }
    } catch (error) {
      console.error('清空分配记录失败:', error);
      // 如果清空失败，抛出错误，不继续执行分配（避免数据不一致）
      throw new Error('清空分配记录失败，无法继续分配');
    }

    const assignments = [];
    const assignedTeams = new Set<number>(); // 记录已分配的项目（使用team_id，更准确）
    const skippedTeams: Array<{ team_id: number; team_name: string; reason: string }> = []; // 记录被跳过的团队
    
    // 专家负载统计（在分配过程中动态更新）
    const expertWorkloads = new Map<number, number>();
    experts.forEach(expert => expertWorkloads.set(expert.id, 0));

    // 为每个团队分配2个专家
    for (const team of teams) {
      // 通过team_documents表获取该团队的文件（使用team_id关联，更可靠）
      // 因为team_name可能会被修改，但team_id不会变
      const teamDocuments = await dbOperations.teamDocuments.findByTeam(team.id) as any[];
      
      if (teamDocuments.length === 0) {
        const reason = `没有上传任何文档`;
        console.warn(`团队 ${team.team_name} (ID: ${team.id}) ${reason}，跳过分配`);
        skippedTeams.push({ team_id: team.id, team_name: team.team_name, reason });
        continue;
      }
      
      // 通过team_documents的document_path找到对应的files记录
      // 如果files表中没有记录，先创建一条记录（确保review_assignments的外键约束）
      const teamFiles = [];
      const allFiles = await dbOperations.files.findAll() as any[];
      
      for (const doc of teamDocuments) {
        // 通过文件路径查找files表中的记录
        let matchingFile = allFiles.find((f: any) => f.file_path === doc.document_path);
        
        if (!matchingFile) {
          // 如果files表中没有，但team_documents有，说明文件存在
          // 需要在files表中创建一条记录，以便review_assignments可以关联
          console.log(`📝 为团队 ${team.team_name} (ID: ${team.id}) 创建files记录: ${doc.document_path}`);
          try {
            const fileResult = await dbOperations.files.create(
              doc.document_name,
              doc.document_path,
              doc.file_size || 0,
              doc.mime_type || 'application/pdf',
              null, // encryptedInfo
              team.team_name // 使用teams表的team_name，确保一致性
            );
            
            // 获取创建的file id（MySQL返回insertId，SQLite返回lastInsertRowid）
            const fileId = (fileResult as any).insertId || (fileResult as any).lastInsertRowid;
            if (fileId) {
              // 重新查询获取完整的file记录
              matchingFile = await dbOperations.files.findById(fileId);
              if (matchingFile) {
                console.log(`✅ 成功创建files记录，file_id: ${fileId}`);
              }
            }
          } catch (error: any) {
            console.error(`❌ 创建files记录失败:`, error);
            // 如果创建失败（可能是唯一约束），尝试重新查询
            const updatedFiles = await dbOperations.files.findAll() as any[];
            matchingFile = updatedFiles.find((f: any) => f.file_path === doc.document_path);
          }
        }
        
        if (matchingFile) {
          teamFiles.push(matchingFile);
        }
      }
      
      if (teamFiles.length === 0) {
        const reason = `无法找到或创建对应的文件记录`;
        console.warn(`团队 ${team.team_name} (ID: ${team.id}) ${reason}，跳过分配`);
        skippedTeams.push({ team_id: team.id, team_name: team.team_name, reason });
        continue;
      }
      
      console.log(`✅ 团队 ${team.team_name} (ID: ${team.id}) 找到 ${teamFiles.length} 个文件`);

      // 选择工作负载最少的2个专家（负载均衡）
      const sortedExperts = experts
        .map(expert => ({ 
          expert, 
          workload: expertWorkloads.get(expert.id) || 0 
        }))
        .sort((a, b) => {
          // 先按负载排序，负载相同则按ID排序（保证稳定性）
          if (a.workload !== b.workload) {
            return a.workload - b.workload;
          }
          return a.expert.id - b.expert.id;
        })
        .slice(0, 2)
        .map(item => item.expert);

      if (sortedExperts.length < 2) {
        const reason = `可用专家不足（需要2个，只有${sortedExperts.length}个）`;
        console.warn(`团队 ${team.team_name} ${reason}，跳过`);
        skippedTeams.push({ team_id: team.id, team_name: team.team_name, reason });
        continue;
      }

      // 为每个专家分配该团队（使用第一个文件作为代表）
      let successfulAssignments = 0; // 记录成功分配的专家数量
      for (const expert of sortedExperts) {
        if (teamFiles.length > 0) {
          try {
            // 先检查是否已存在（防止重复分配）
            const existing = await dbOperations.assignments.findByExpertAndFile(expert.id, teamFiles[0].id) as any[];
            if (existing && Array.isArray(existing) && existing.length > 0) {
              console.log(`⚠️ 跳过重复分配: 专家${expert.id}已分配文件${teamFiles[0].id}`);
              successfulAssignments++; // 已存在的也算成功
              continue;
            }
            
            await dbOperations.assignments.create(teamFiles[0].id, expert.id);
            successfulAssignments++; // 成功创建分配记录
            
            // 更新专家负载
            const currentWorkload = expertWorkloads.get(expert.id) || 0;
            expertWorkloads.set(expert.id, currentWorkload + 1);
            
            console.log(`✅ 分配: 专家${expert.id}(${expert.username}) -> 团队${team.team_name} (负载: ${currentWorkload + 1})`);

            assignments.push({
              team_id: team.id,
              team_name: team.team_name,
              expert_id: expert.id,
              expert_name: expert.username,
              expert_type: expert.expert_type || 'team',
              team_type: team.is_enterprise ? 'enterprise' : 'team',
              status: 'assigned',
              file_id: teamFiles[0].id,
              file_name: `${team.team_name}_团队评审`
            });
          } catch (error: any) {
            // 如果是唯一约束冲突，跳过（可能因为并发或其他原因）
            if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('UNIQUE constraint')) {
              console.log(`⚠️ 跳过重复分配（唯一约束）: 专家${expert.id} -> 文件${teamFiles[0].id}`);
              successfulAssignments++; // 唯一约束冲突也算已分配
              continue;
            }
            // 其他错误则抛出
            throw error;
          }
        }
      }
      
      // 只有成功分配了2个专家，才记录为已分配团队（使用team_id，避免team_name重复的问题）
      if (successfulAssignments >= 2) {
        assignedTeams.add(team.id);
        console.log(`✅ 团队 ${team.team_name} (ID: ${team.id}) 已成功分配 ${successfulAssignments} 个专家`);
      } else {
        console.warn(`⚠️ 团队 ${team.team_name} (ID: ${team.id}) 只分配了 ${successfulAssignments} 个专家（需要2个）`);
      }
    }

    const totalTeamsCount = teams.length;
    const skippedTeamsCount = skippedTeams.length;
    
    // 查询数据库中实际的分配记录，基于数据库统计（最准确）
    // 每个团队应该有2个专家的分配记录
    const skippedTeamIds = new Set(skippedTeams.map(t => t.team_id));
    const unassignedTeams: Array<{ team_id: number; team_name: string; reason: string }> = [];
    
    // 获取所有已分配的记录
    const allAssignments = await dbOperations.assignments.findAll() as any[];
    
    // 获取所有files记录，建立file_id到team_id的映射
    const allFiles = await dbOperations.files.findAll() as any[];
    const fileToTeamIdMap = new Map<number, number>();
    
    // 通过team_documents关联files和teams（建立file_id -> team_id映射）
    for (const team of teams) {
      const teamDocs = await dbOperations.teamDocuments.findByTeam(team.id) as any[];
      for (const doc of teamDocs) {
        const matchingFile = allFiles.find((f: any) => f.file_path === doc.document_path);
        if (matchingFile) {
          fileToTeamIdMap.set(matchingFile.id, team.id);
        }
      }
    }
    
    // 统计每个team_id的分配记录数（更准确）
    const teamAssignmentCountsById = new Map<number, number>();
    for (const assignment of allAssignments) {
      const teamId = fileToTeamIdMap.get(assignment.file_id);
      if (teamId) {
        const count = teamAssignmentCountsById.get(teamId) || 0;
        teamAssignmentCountsById.set(teamId, count + 1);
      }
    }
    
    // 统计已分配的团队（有2个或以上分配记录的团队）
    const assignedTeamIds = new Set<number>();
    for (const team of teams) {
      const isSkipped = skippedTeamIds.has(team.id);
      if (isSkipped) continue;
      
      const assignmentCount = teamAssignmentCountsById.get(team.id) || 0;
      if (assignmentCount >= 2) {
        assignedTeamIds.add(team.id);
      } else {
        // 找出未分配的团队
        let reason = '';
        if (assignmentCount === 0) {
          reason = '数据库中没有分配记录（可能分配过程中出现错误）';
        } else {
          reason = `只有 ${assignmentCount} 个专家分配记录（需要2个）`;
        }
        unassignedTeams.push({
          team_id: team.id,
          team_name: team.team_name,
          reason
        });
      }
    }
    
    // 使用数据库统计的结果（最准确）
    const assignedTeamsCount = assignedTeamIds.size;
    
    // 添加详细日志
    console.log('📊 分配统计:');
    console.log(`  - 总团队数: ${totalTeamsCount}`);
    console.log(`  - 已分配团队数（基于数据库）: ${assignedTeamsCount}`);
    console.log(`  - 跳过团队数: ${skippedTeamsCount}`);
    console.log(`  - 未分配团队数: ${unassignedTeams.length}`);
    console.log(`  - 数据库分配记录总数: ${allAssignments.length}`);
    console.log(`  - 团队分配记录统计（按team_id）:`, Array.from(teamAssignmentCountsById.entries()).slice(0, 10).map(([id, count]) => `team_${id}: ${count}`).join(', '), `... (共${teamAssignmentCountsById.size}个团队)`);
    console.log(`  - 跳过团队详情:`, skippedTeams);
    console.log(`  - 未分配团队详情:`, unassignedTeams);
    
    // 合并跳过和未分配的团队
    const allUnassignedTeams = [...skippedTeams, ...unassignedTeams];
    
    return {
      success: true,
      message: `成功分配 ${assignments.length} 个评审任务，已分配 ${assignedTeamsCount} 个项目${allUnassignedTeams.length > 0 ? `（${skippedTeamsCount > 0 ? `跳过 ${skippedTeamsCount} 个` : ''}${unassignedTeams.length > 0 ? `${skippedTeamsCount > 0 ? '，' : ''}未分配 ${unassignedTeams.length} 个` : ''}项目）` : ''}`,
      assignments: assignments,
      statistics: {
        totalAssignments: assignments.length,
        assignedTeams: assignedTeamsCount,
        totalTeams: totalTeamsCount,
        skippedTeams: skippedTeamsCount,
        unassignedTeams: unassignedTeams.length
      },
      skippedTeams: skippedTeams, // 返回被跳过的团队详情
      unassignedTeams: unassignedTeams // 返回所有未分配的团队（包括跳过和未处理的）
    };

  } catch (error) {
    console.error('Review assignment failed:', error);
    return { success: false, message: '分配失败', assignments: [], skippedTeams: [] };
  }
}

export async function getExpertAssignments(expertId: number): Promise<ReviewAssignment[]> {
  try {
    return await dbOperations.assignments.findByExpert(expertId) as any[];
  } catch (error) {
    console.error('Failed to get expert assignments:', error);
    return [];
  }
}

export async function submitReview(
  assignmentId: number,
  score: number,
  comments: string
): Promise<boolean> {
  try {
    const result = await dbOperations.assignments.updateScore(assignmentId, score, comments);
    return result.changes > 0;
  } catch (error) {
    console.error('Failed to submit review:', error);
    return false;
  }
}

export async function getAllAssignments(): Promise<any[]> {
  try {
    return await dbOperations.assignments.findAll() as any[];
  } catch (error) {
    console.error('Failed to get all assignments:', error);
    return [];
  }
}

export async function getReviewStatistics(): Promise<any> {
  try {
    console.log('📊 开始获取统计数据...');
    
    // 获取分配统计
    let stats = {};
    try {
      stats = await dbOperations.assignments.getStatistics() as any;
      console.log('📊 分配统计数据:', stats);
    } catch (error) {
      console.error('❌ 获取分配统计失败:', error);
    }
    
    // 获取团队统计 - 只统计已通过审核的团队（排除删除和拒绝的）
    let teams = [];
    try {
      const allTeams = await dbOperations.teams.findAll() as any[];
      // 只统计已通过审核且状态为活跃的团队
      teams = allTeams.filter(t => 
        t.audit_status === 'approved' && 
        t.status === 'active'
      );
      console.log('📊 团队数据: 总数', allTeams.length, '个，有效团队（approved+active）:', teams.length, '个');
    } catch (error) {
      console.error('❌ 获取团队数据失败:', error);
    }
    
    // 获取文件统计 - 只统计有效团队的文件
    let files = [];
    try {
      const allFiles = await dbOperations.files.findAll() as any[];
      const validTeamNames = new Set(teams.map(t => t.team_name));
      files = allFiles.filter(f => validTeamNames.has(f.team_name));
      console.log('📊 文件数据: 总数', allFiles.length, '个，有效团队文件:', files.length, '个');
    } catch (error) {
      console.error('❌ 获取文件数据失败:', error);
    }
    
    // 确保 is_enterprise 字段的类型一致性处理
    // MySQL 的 BOOLEAN 可能返回 0/1 或 true/false
    const teamStats = {
      total_teams: teams.length || 0,
      enterprise_teams: teams.filter(t => t.is_enterprise === true || t.is_enterprise === 1).length || 0,
      team_groups: teams.filter(t => !t.is_enterprise || t.is_enterprise === false || t.is_enterprise === 0).length || 0,
      active_teams: teams.length || 0 // 已经是过滤后的活跃团队
    };
    
    // 调试日志：检查 is_enterprise 值的分布
    const enterpriseCount = teams.filter(t => t.is_enterprise === true || t.is_enterprise === 1).length;
    const teamGroupCount = teams.filter(t => !t.is_enterprise || t.is_enterprise === false || t.is_enterprise === 0).length;
    console.log('📊 团队分类统计:', {
      total: teams.length,
      enterprise: enterpriseCount,
      team_groups: teamGroupCount,
      sum: enterpriseCount + teamGroupCount,
      mismatch: teams.length - (enterpriseCount + teamGroupCount)
    });

    const fileStats = {
      total_files: files.length || 0,
      completed_files: files.filter(f => f.upload_status === 'completed').length || 0
    };

    // 获取国别统计
    let nationalityStats = {};
    try {
      nationalityStats = await getNationalityStatistics(teams);
      console.log('📊 国别统计数据:', nationalityStats);
    } catch (error) {
      console.error('❌ 获取国别统计失败:', error);
    }

    const result = {
      assignments: stats || {},
      teams: teamStats,
      files: fileStats,
      nationality: nationalityStats
    };
    
    console.log('📊 最终统计数据:', result);
    return result;
  } catch (error) {
    console.error('❌ 获取统计数据失败:', error);
    return {
      assignments: {},
      teams: {},
      files: {},
      nationality: {}
    };
  }
}

// 新增：获取国别统计数据的函数
async function getNationalityStatistics(teams: any[]): Promise<any> {
  try {
    const { decryptData } = await import('./encryption');
    
    // 只统计已通过审核且状态为活跃的团队（排除删除和拒绝的）
    // 注意：teams 参数已经在上层过滤过了，这里再次确认
    const validTeams = teams.filter(t => 
      t.audit_status === 'approved' && 
      t.status === 'active'
    );
    console.log('🔍 开始分析国别统计数据，总团队数:', teams.length, '有效团队数（approved+active）:', validTeams.length);
    
    // 国家参与度统计：包含企业组和团队组（需要在所有统计之前初始化）
    const countryParticipation: { [key: string]: { single: number; multiple: number; enterprise: number } } = {};
    
    // 企业组国别统计（确保 is_enterprise 类型一致性）
    const enterpriseTeams = validTeams.filter(t => t.is_enterprise === true || t.is_enterprise === 1);
    const enterpriseCountryStats: { [key: string]: number } = {};
    
    console.log('🏢 企业组数量:', enterpriseTeams.length);
    
    for (const team of enterpriseTeams) {
      try {
        let registrationCountry = null;
        
        // 企业组：优先从 selected_countries 字段读取（更可靠）
        if (team.selected_countries) {
          try {
            const countriesArray = JSON.parse(team.selected_countries);
            if (Array.isArray(countriesArray) && countriesArray.length > 0) {
              registrationCountry = countriesArray[0];
              console.log(`企业组 ${team.team_name}: 从 selected_countries 获取注册国家 = ${registrationCountry}`);
            }
          } catch (parseError) {
            console.warn(`企业组 ${team.team_name}: 解析 selected_countries 失败:`, parseError);
          }
        }
        
        // 如果 selected_countries 没有，尝试从加密信息中获取
        if (!registrationCountry) {
          try {
            const decryptedInfo = JSON.parse(decryptData(team.encrypted_info));
            registrationCountry = decryptedInfo?.enterpriseInfo?.registrationCountry;
            console.log(`企业组 ${team.team_name}: 从 encrypted_info 获取注册国家 = ${registrationCountry}`);
          } catch (decryptError) {
            console.warn(`企业组 ${team.team_name}: 解密失败:`, decryptError);
          }
        }
        
        // 如果是 "others"，使用 nationality_others 字段的值
        if (registrationCountry === 'others' && team.nationality_others) {
          registrationCountry = team.nationality_others;
          console.log(`   → 使用自定义国家: ${registrationCountry}`);
        }
        
        if (registrationCountry) {
          enterpriseCountryStats[registrationCountry] = (enterpriseCountryStats[registrationCountry] || 0) + 1;
          
          // 更新国家参与度统计（企业组）
          if (!countryParticipation[registrationCountry]) {
            countryParticipation[registrationCountry] = { single: 0, multiple: 0, enterprise: 0 };
          }
          countryParticipation[registrationCountry].enterprise++;
        } else {
          console.warn(`企业组 ${team.team_name}: 无法获取注册国家`);
        }
      } catch (error) {
        console.warn(`处理企业组 ${team.team_name} 失败:`, error);
      }
    }
    
    // 团队组国别统计（确保 is_enterprise 类型一致性）
    const teamGroups = validTeams.filter(t => !t.is_enterprise || t.is_enterprise === false || t.is_enterprise === 0);
    let singleNationalityTeams = 0;
    let multipleNationalityTeams = 0;
    const singleCountryStats: { [key: string]: number } = {};
    const multipleCountryCombinations: { [key: string]: number } = {};
    
    console.log('👥 团队组数量:', teamGroups.length);
    
    let processedTeams = 0;
    let unprocessedTeams = 0;
    const unprocessedTeamDetails: string[] = [];
    
    for (const team of teamGroups) {
      try {
        console.log(`\n🔍 处理团队组 ${team.team_name} (ID: ${team.id}):`);
        console.log(`   nationality_type: "${team.nationality_type}" (类型: ${typeof team.nationality_type})`);
        console.log(`   selected_countries: "${team.selected_countries}" (类型: ${typeof team.selected_countries})`);
        
        // 团队组：优先从数据库字段直接读取，如果为空则尝试解密
        let nationalityType = team.nationality_type;
        let selectedCountries = team.selected_countries;
        
        // 如果数据库字段为空，尝试从加密信息中获取
        if (!nationalityType || !selectedCountries) {
          try {
            const decryptedInfo = JSON.parse(decryptData(team.encrypted_info));
            nationalityType = nationalityType || decryptedInfo?.basicInfo?.nationalityType;
            selectedCountries = selectedCountries || decryptedInfo?.basicInfo?.selectedCountries;
            console.log(`   🔓 从加密信息获取: nationalityType="${nationalityType}", selectedCountries=${JSON.stringify(selectedCountries)}`);
          } catch (decryptError) {
            console.warn(`   ❌ 解密团队组 ${team.team_name} 信息失败:`, decryptError);
          }
        }
        
        // 处理selected_countries字符串格式
        let countriesArray = [];
        if (typeof selectedCountries === 'string' && selectedCountries.trim()) {
          try {
            // 尝试解析JSON字符串
            countriesArray = JSON.parse(selectedCountries);
            console.log(`   📝 JSON解析成功: ${JSON.stringify(countriesArray)}`);
          } catch {
            // 如果不是JSON，按逗号分割
            countriesArray = selectedCountries.split(',').map(c => c.trim()).filter(c => c);
            console.log(`   📝 逗号分割: ${JSON.stringify(countriesArray)}`);
          }
        } else if (Array.isArray(selectedCountries)) {
          countriesArray = selectedCountries;
          console.log(`   📝 直接数组: ${JSON.stringify(countriesArray)}`);
        } else {
          console.log(`   ⚠️ selected_countries为空或无效: "${selectedCountries}"`);
        }
        
        console.log(`   🎯 最终国家数组: ${JSON.stringify(countriesArray)}`);
        
        if (nationalityType === 'single') {
          singleNationalityTeams++;
          if (countriesArray.length === 1) {
            // 有具体国家信息
            let country = countriesArray[0];
            
            // 如果是 "others"，使用 nationality_others 字段的值
            if (country === 'others' && team.nationality_others) {
              country = team.nationality_others;
              console.log(`   → 使用自定义国家: ${country}`);
            }
            
            singleCountryStats[country] = (singleCountryStats[country] || 0) + 1;
            
            // 更新国家参与度统计（单一国别团队组）
            if (!countryParticipation[country]) {
              countryParticipation[country] = { single: 0, multiple: 0, enterprise: 0 };
            }
            countryParticipation[country].single++;
            console.log(`   ✅ 单一国别团队: ${country}`);
          } else {
            // 没有具体国家信息，但类型是单一国别
            singleCountryStats['未指定'] = (singleCountryStats['未指定'] || 0) + 1;
            console.log(`   ✅ 单一国别团队: 未指定国家`);
          }
          processedTeams++;
        } else if (nationalityType === 'multiple') {
          multipleNationalityTeams++;
          if (countriesArray.length > 1) {
            // 有具体国家信息
            // 处理 "others" 情况，使用 nationality_others 字段的值
            const processedCountries = countriesArray.map(country => {
              if (country === 'others' && team.nationality_others) {
                console.log(`   → 多国别中的 others 使用自定义国家: ${team.nationality_others}`);
                return team.nationality_others;
              }
              return country;
            });
            
            const combination = processedCountries.sort().join(' + ');
            multipleCountryCombinations[combination] = (multipleCountryCombinations[combination] || 0) + 1;
            
            // 更新国家参与度统计（多国别团队组，每个国家分别计数）
            for (const country of processedCountries) {
              if (!countryParticipation[country]) {
                countryParticipation[country] = { single: 0, multiple: 0, enterprise: 0 };
              }
              countryParticipation[country].multiple++;
            }
            console.log(`   ✅ 多国别团队: ${combination}`);
          } else {
            // 没有具体国家信息，但类型是多国别
            multipleCountryCombinations['未指定'] = (multipleCountryCombinations['未指定'] || 0) + 1;
            console.log(`   ✅ 多国别团队: 未指定国家`);
          }
          processedTeams++;
        } else {
          unprocessedTeams++;
          const reason = `type="${nationalityType}", countries=${JSON.stringify(countriesArray)}`;
          unprocessedTeamDetails.push(`${team.team_name}: ${reason}`);
          console.log(`   ⚠️ 未匹配的团队: ${reason}`);
        }
      } catch (error) {
        unprocessedTeams++;
        unprocessedTeamDetails.push(`${team.team_name}: 处理异常 - ${error.message}`);
        console.warn(`   ❌ 处理团队组 ${team.team_name} 信息失败:`, error);
      }
    }
    
    console.log(`\n📊 团队组处理结果:`);
    console.log(`   总团队组数: ${teamGroups.length}`);
    console.log(`   已处理: ${processedTeams} (单一: ${singleNationalityTeams}, 多国别: ${multipleNationalityTeams})`);
    console.log(`   未处理: ${unprocessedTeams}`);
    if (unprocessedTeamDetails.length > 0) {
      console.log(`   未处理详情:`);
      unprocessedTeamDetails.forEach(detail => console.log(`     - ${detail}`));
    }
    
    // 计算涉及的国家总数
    const allCountries = new Set([
      ...Object.keys(enterpriseCountryStats),
      ...Object.keys(singleCountryStats),
      ...Object.keys(countryParticipation)
    ]);
    
    console.log('📊 统计结果:');
    console.log('- 企业组:', enterpriseTeams.length, '个');
    console.log('- 团队组单一国别:', singleNationalityTeams, '个');
    console.log('- 团队组多国别:', multipleNationalityTeams, '个');
    console.log('- 涉及国家总数:', allCountries.size, '个');

    return {
      // 企业组统计
      enterprise: {
        total: enterpriseTeams.length,
        by_country: enterpriseCountryStats
      },
      // 团队组统计
      team_groups: {
        total: teamGroups.length,
        single_nationality: {
          count: singleNationalityTeams,
          by_country: singleCountryStats
        },
        multiple_nationality: {
          count: multipleNationalityTeams,
          combinations: multipleCountryCombinations
        }
      },
      // 综合统计
      summary: {
        total_countries_involved: allCountries.size,
        country_participation: countryParticipation
      }
    };
  } catch (error) {
    console.error('❌ 计算国别统计失败:', error);
    return {};
  }
}
