import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbOperations } from '@/lib/database-adapter';
import { decryptData } from '@/lib/encryption';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

export const dynamic = 'force-dynamic';

// 创建导出任务
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    // 创建任务
    const taskId = await dbOperations.exportTasks.create('export_all', user.username || 'admin');
    
    // 异步处理任务（不阻塞响应）
    processExportTask(taskId).catch(error => {
      console.error(`任务 ${taskId} 处理失败:`, error);
      dbOperations.exportTasks.update(taskId, {
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error)
      });
    });
    
    return NextResponse.json({
      success: true,
      taskId: taskId,
      message: '导出任务已创建，正在后台处理，请稍候查询任务状态...'
    });

  } catch (error) {
    console.error('创建导出任务失败:', error);
    return NextResponse.json(
      { error: `创建任务失败: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

// 异步处理导出任务
async function processExportTask(taskId: number) {
  try {
    // 更新任务状态为处理中
    await dbOperations.exportTasks.update(taskId, {
      status: 'processing',
      progress_message: '开始获取团队数据...'
    });

    console.log(`开始处理导出任务 ${taskId}...`);

    // 1. 获取所有团队
    const teams = await dbOperations.teams.findAll();
    if (!Array.isArray(teams) || teams.length === 0) {
      await dbOperations.exportTasks.update(taskId, {
        status: 'failed',
        error_message: '没有找到任何团队'
      });
      return;
    }

    const totalTeams = teams.length;
    await dbOperations.exportTasks.update(taskId, {
      progress_message: `找到 ${totalTeams} 个团队，开始处理...`
    });

    // 2. 动态导入xlsx库
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();

    // 3. 创建汇总表
    const summaryHeaders = [
      '团队ID',
      '团队名称',
      '团队类型',
      '联系邮箱',
      '项目名称',
      '企业注册国家/核心成员国籍',
      '其他国籍说明',
      '项目阶段',
      '项目阶段其他',
      '审核状态',
      '注册时间',
      '联系人姓名',
      '联系人职位',
      '联系电话',
      '联系人邮箱',
      '联系人单位',
      '企业名称',
      '统一社会信用代码',
      '注册时间',
      '法定代表人',
      '总部所在地',
      '注册资本(USD)',
      '企业电话',
      '企业网站',
      '项目简介',
      '企业简介',
      '核心成员数量'
    ];

    const summaryData = [summaryHeaders];

    // 4. 处理每个团队
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];
      try {
        // 更新进度
        if ((i + 1) % 10 === 0 || i === teams.length - 1) {
          await dbOperations.exportTasks.update(taskId, {
            progress_message: `正在处理团队 ${i + 1}/${totalTeams}...`
          });
        }

        // 解密团队信息
        let decryptedInfo: any = {};
        try {
          decryptedInfo = JSON.parse(decryptData(team.encrypted_info));
        } catch (error) {
          console.error(`团队 ${team.id} 解密失败:`, error);
          continue;
        }

        // 获取核心成员
        const coreMembers = await dbOperations.coreMembers.findByTeam(team.id);
        const coreMembersCount = Array.isArray(coreMembers) ? coreMembers.length : 0;

        // 处理国别信息
        let countryDisplay = '';
        let countryOthers = '';
        if (team.is_enterprise) {
          const regCountry = decryptedInfo.basicInfo?.registrationCountry || '';
          const countryMap: { [key: string]: string } = {
            'china': '中国',
            'thailand': '泰国',
            'cambodia': '柬埔寨',
            'vietnam': '越南',
            'laos': '老挝',
            'myanmar': '缅甸',
            'others': '其他'
          };
          countryDisplay = countryMap[regCountry] || regCountry;
          countryOthers = regCountry === 'others' ? (team.nationality_others || decryptedInfo.basicInfo?.registrationCountryOthers || '') : '';
        } else {
          if (team.nationality_type === 'single') {
            const nationality = decryptedInfo.basicInfo?.coreMembersNationality || '';
            const nationalityMap: { [key: string]: string } = {
              'china': '中国',
              'thailand': '泰国',
              'cambodia': '柬埔寨',
              'vietnam': '越南',
              'laos': '老挝',
              'myanmar': '缅甸',
              'others': '其他'
            };
            countryDisplay = nationalityMap[nationality] || nationality;
            countryOthers = nationality === 'others' ? (team.nationality_others || decryptedInfo.basicInfo?.nationalityOthers || '') : '';
          } else {
            try {
              const selectedCountries = JSON.parse(team.selected_countries || '[]');
              const countryMap: { [key: string]: string } = {
                'china': '中国',
                'thailand': '泰国',
                'cambodia': '柬埔寨',
                'vietnam': '越南',
                'laos': '老挝',
                'myanmar': '缅甸',
                'others': '其他'
              };
              countryDisplay = selectedCountries.map((c: string) => countryMap[c] || c).join('、');
              if (selectedCountries.includes('others')) {
                countryOthers = team.nationality_others || decryptedInfo.basicInfo?.nationalityOthers || '';
              }
            } catch (e) {
              countryDisplay = team.selected_countries || '';
            }
          }
        }

        // 构建汇总行数据
        const row = [
          team.id,
          team.team_name || '',
          team.is_enterprise ? '企业组' : '团队组',
          team.contact_email || '',
          decryptedInfo.basicInfo?.projectName || team.team_name || '',
          countryDisplay,
          countryOthers,
          decryptedInfo.basicInfo?.projectStage || '',
          decryptedInfo.basicInfo?.projectStageOthers || '',
          team.audit_status || 'pending',
          new Date(team.created_at).toLocaleString('zh-CN'),
          decryptedInfo.contactInfo?.contactPersonName || '',
          decryptedInfo.contactInfo?.contactPersonPosition || '',
          decryptedInfo.contactInfo?.contactPersonPhone || '',
          decryptedInfo.contactInfo?.contactPersonEmail || team.contact_email || '',
          decryptedInfo.contactInfo?.contactPersonUnit || '',
          decryptedInfo.enterpriseInfo?.enterpriseName || '',
          decryptedInfo.enterpriseInfo?.unifiedSocialCreditCode || '',
          decryptedInfo.enterpriseInfo?.registrationYear || '',
          decryptedInfo.enterpriseInfo?.legalRepresentative || '',
          decryptedInfo.enterpriseInfo?.headquartersLocation || '',
          decryptedInfo.enterpriseInfo?.registeredCapitalUsd || '',
          decryptedInfo.enterpriseInfo?.phone || '',
          decryptedInfo.enterpriseInfo?.website || '',
          decryptedInfo.basicInfo?.projectBrief || '',
          decryptedInfo.enterpriseInfo?.enterpriseOverview || '',
          coreMembersCount
        ];

        summaryData.push(row);
      } catch (error) {
        console.error(`处理团队 ${team.id} 时出错:`, error);
        summaryData.push([
          team.id,
          team.team_name || '未知',
          '处理失败',
          team.contact_email || '',
          '', '', '', '', '', '', '',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          `处理失败: ${error instanceof Error ? error.message : String(error)}`,
          '',
          0
        ]);
      }
    }

    await dbOperations.exportTasks.update(taskId, {
      progress_message: '正在生成Excel文件...'
    });

    // 5. 创建汇总表sheet
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, '团队汇总');

    // 6. 创建详细核心成员表
    const memberHeaders = [
      '团队ID',
      '团队名称',
      '团队类型',
      '成员序号',
      '姓名',
      '国籍',
      '性别',
      '出生年月',
      '证件类型',
      '证件号码',
      '电话',
      '电子邮箱',
      '毕业院校',
      '最高学历',
      '所在单位',
      '职务/职称',
      '简历'
    ];

    const memberData = [memberHeaders];

    await dbOperations.exportTasks.update(taskId, {
      progress_message: '正在收集核心成员信息...'
    });

    // 7. 收集所有团队的核心成员
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];
      try {
        const coreMembers = await dbOperations.coreMembers.findByTeam(team.id);
        if (Array.isArray(coreMembers) && coreMembers.length > 0) {
          coreMembers.forEach((member: any, index: number) => {
            try {
              const decryptedPhone = member.phone ? decryptData(member.phone) : '';
              const decryptedIdNumber = member.id_number ? decryptData(member.id_number) : '';

              memberData.push([
                team.id,
                team.team_name || '',
                team.is_enterprise ? '企业组' : '团队组',
                index + 1,
                member.name || '',
                member.nationality || '',
                member.gender || '',
                member.birth_date || '',
                member.id_type || '',
                decryptedIdNumber,
                decryptedPhone,
                member.email || '',
                member.university || '',
                member.highest_degree || '',
                member.organization || '',
                member.position || '',
                member.cv_file_name ? '已上传' : '未上传'
              ]);
            } catch (error) {
              console.error(`解密核心成员 ${member.id} 数据失败:`, error);
              memberData.push([
                team.id,
                team.team_name || '',
                team.is_enterprise ? '企业组' : '团队组',
                index + 1,
                member.name || '',
                member.nationality || '',
                member.gender || '',
                member.birth_date || '',
                member.id_type || '',
                '[解密失败]',
                '[解密失败]',
                member.email || '',
                member.university || '',
                member.highest_degree || '',
                member.organization || '',
                member.position || '',
                member.cv_file_name ? '已上传' : '未上传'
              ]);
            }
          });
        }
      } catch (error) {
        console.error(`获取团队 ${team.id} 的核心成员失败:`, error);
      }
    }

    // 8. 创建核心成员表sheet
    const memberSheet = XLSX.utils.aoa_to_sheet(memberData);
    XLSX.utils.book_append_sheet(workbook, memberSheet, '核心成员详情');

    await dbOperations.exportTasks.update(taskId, {
      progress_message: '正在保存Excel文件...'
    });

    // 9. 生成Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 10. 保存文件到服务器
    const exportDir = path.join(process.cwd(), 'exports');
    await mkdir(exportDir, { recursive: true });
    
    const fileName = `所有团队信息整合_${taskId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filePath = path.join(exportDir, fileName);
    await writeFile(filePath, excelBuffer);

    console.log(`✅ 任务 ${taskId} 完成，文件大小: ${(excelBuffer.length / 1024).toFixed(2)} KB`);

    // 11. 更新任务状态为完成
    await dbOperations.exportTasks.update(taskId, {
      status: 'completed',
      file_path: filePath,
      file_name: fileName,
      progress_message: `导出完成！共 ${totalTeams} 个团队`
    });

  } catch (error) {
    console.error(`任务 ${taskId} 处理失败:`, error);
    await dbOperations.exportTasks.update(taskId, {
      status: 'failed',
      error_message: error instanceof Error ? error.message : String(error)
    });
  }
}
