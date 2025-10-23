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

export async function assignReviewsToExperts(): Promise<{ success: boolean; message: string; assignments: any[] }> {
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

    const assignments = [];

    // 为每个团队分配至少2个专家（根据团队类型匹配专家类型）
    for (const team of teams) {
      // 获取该团队的所有文件
      const teamFiles = await dbOperations.files.findByTeam(team.team_name) as any[];
      if (teamFiles.length === 0) {
        console.warn(`团队 ${team.team_name} 没有上传任何文档，跳过分配`);
        continue;
      }

      // 检查是否已经完整分配过 - 检查该团队是否已经有完整的专家分配
      const allAssignments = await dbOperations.assignments.findAll() as any[];
      const teamFileIds = teamFiles.map(f => f.id);
      const existingAssignments = allAssignments.filter(a => 
        teamFileIds.includes(a.file_id)
      );

      // 如果该团队的文件已经被分配，检查是否分配完整
      if (existingAssignments.length > 0) {
        // 统计每个专家分配的文件数量
        const expertFileCounts = {};
        existingAssignments.forEach(assignment => {
          const expertId = assignment.expert_id;
          expertFileCounts[expertId] = (expertFileCounts[expertId] || 0) + 1;
        });

        // 检查是否所有分配该团队的专家都分配了所有文件
        const assignedExpertIds = Object.keys(expertFileCounts);
        const isCompleteAssignment = assignedExpertIds.every(expertId => 
          expertFileCounts[expertId] === teamFiles.length
        );

        if (isCompleteAssignment) {
          console.log(`团队 ${team.team_name} 已经完整分配过专家，跳过`);
          continue;
        } else {
          console.log(`团队 ${team.team_name} 分配不完整，继续分配`);
        }
      }

      // 根据团队类型筛选专家
      const teamType = team.is_enterprise ? 'enterprise' : 'team';
      const matchingExperts = experts.filter(expert => expert.expert_type === teamType);

      if (matchingExperts.length < 2) {
        console.warn(`团队 ${team.team_name} 的匹配专家数量不足 (${matchingExperts.length} < 2)`);
        continue;
      }

      // 选择工作负载最少的专家（负载均衡）
      const expertWorkloads = await Promise.all(
        matchingExperts.map(async (expert) => {
          const assignments = await dbOperations.assignments.findByExpert(expert.id) as any[];
          return {
            expert,
            workload: assignments.length
          };
        })
      );
      
      // 按工作负载排序，选择负载最少的2个专家
      const sortedExperts = expertWorkloads.sort((a, b) => a.workload - b.workload);
      const selectedExperts = sortedExperts.slice(0, Math.min(2, matchingExperts.length)).map(item => item.expert);
      
      console.log(`📊 专家负载情况:`, expertWorkloads.map(item => 
        `专家${item.expert.id}(${item.expert.username}): ${item.workload}个任务`
      ).join(', '));

      // 创建分配记录 - 为每个专家分配该团队的所有文件
      for (const expert of selectedExperts) {
        // 检查该专家是否已经分配过这个团队的任何文件
        const existingAssignments = await dbOperations.assignments.findByExpertAndTeam(expert.id, team.team_name) as any[];
        console.log(`🔍 检查专家${expert.id}对团队${team.team_name}的现有分配:`, existingAssignments.length);
        
        if (existingAssignments.length === 0) {
          // 为该专家分配该团队（按团队分配，不是按文件）
          // 使用第一个文件作为代表，但实际评审的是整个团队
          if (teamFiles.length > 0) {
            await dbOperations.assignments.create(teamFiles[0].id, expert.id);
            console.log(`✅ 创建新分配: 专家${expert.id} 团队${team.team_name} (使用文件${teamFiles[0].id}作为代表)`);

        assignments.push({
          team_id: team.id,
          team_name: team.team_name,
          expert_id: expert.id,
          expert_name: expert.username,
          expert_type: expert.expert_type,
          team_type: teamType,
              status: 'assigned',
              file_id: teamFiles[0].id,
              file_name: `${team.team_name}_团队评审`
        });
          }
        } else {
          console.log(`⚠️ 跳过重复分配: 专家${expert.id}已经分配过团队${team.team_name}`);
        }
      }
    }

    return {
      success: true,
      message: `成功分配 ${assignments.length} 个评审任务`,
      assignments: assignments
    };

  } catch (error) {
    console.error('Review assignment failed:', error);
    return { success: false, message: '分配失败', assignments: [] };
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
    
    // 获取团队统计
    let teams = [];
    try {
      teams = await dbOperations.teams.findAll() as any[];
      console.log('📊 团队数据:', teams.length, '个团队');
    } catch (error) {
      console.error('❌ 获取团队数据失败:', error);
    }
    
    // 获取文件统计
    let files = [];
    try {
      files = await dbOperations.files.findAll() as any[];
      console.log('📊 文件数据:', files.length, '个文件');
    } catch (error) {
      console.error('❌ 获取文件数据失败:', error);
    }
    
    const teamStats = {
      total_teams: teams.length || 0,
      enterprise_teams: teams.filter(t => t.is_enterprise).length || 0,
      team_groups: teams.filter(t => !t.is_enterprise).length || 0,
      active_teams: teams.filter(t => t.status === 'active').length || 0
    };

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
    
    console.log('🔍 开始分析国别统计数据，总团队数:', teams.length);
    
    // 企业组国别统计
    const enterpriseTeams = teams.filter(t => t.is_enterprise);
    const enterpriseCountryStats: { [key: string]: number } = {};
    
    console.log('🏢 企业组数量:', enterpriseTeams.length);
    
    for (const team of enterpriseTeams) {
      try {
        // 企业组：从加密信息中获取注册国家
        const decryptedInfo = JSON.parse(decryptData(team.encrypted_info));
        const registrationCountry = decryptedInfo?.enterpriseInfo?.registrationCountry;
        console.log(`企业组 ${team.team_name}: 注册国家 = ${registrationCountry}`);
        
        if (registrationCountry) {
          enterpriseCountryStats[registrationCountry] = (enterpriseCountryStats[registrationCountry] || 0) + 1;
        }
      } catch (error) {
        console.warn(`解密企业组 ${team.team_name} 信息失败:`, error);
      }
    }
    
    // 团队组国别统计
    const teamGroups = teams.filter(t => !t.is_enterprise);
    let singleNationalityTeams = 0;
    let multipleNationalityTeams = 0;
    const singleCountryStats: { [key: string]: number } = {};
    const multipleCountryCombinations: { [key: string]: number } = {};
    const countryParticipation: { [key: string]: { single: number; multiple: number } } = {};
    
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
            const country = countriesArray[0];
            singleCountryStats[country] = (singleCountryStats[country] || 0) + 1;
            
            // 更新国家参与度统计
            if (!countryParticipation[country]) {
              countryParticipation[country] = { single: 0, multiple: 0 };
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
            const combination = countriesArray.sort().join(' + ');
            multipleCountryCombinations[combination] = (multipleCountryCombinations[combination] || 0) + 1;
            
            // 更新国家参与度统计
            for (const country of countriesArray) {
              if (!countryParticipation[country]) {
                countryParticipation[country] = { single: 0, multiple: 0 };
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
