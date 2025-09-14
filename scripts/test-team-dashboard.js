// 使用内置fetch（Node.js 18+）

// 测试配置
const BASE_URL = 'http://localhost:3000';
const TEST_TEAM = {
  email: 'testgroup12@qq.com',
  password: '123456'
};

async function testTeamDashboard() {
  console.log('🧪 开始测试团队管理后台功能...\n');

  try {
    // 1. 测试团队登录
    console.log('1️⃣ 测试团队登录...');
    const loginResponse = await fetch(`${BASE_URL}/api/teams/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_TEAM)
    });

    if (!loginResponse.ok) {
      throw new Error(`登录失败: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error(`登录失败: ${loginData.error}`);
    }

    const token = loginData.token;
    console.log('✅ 团队登录成功');

    // 2. 测试获取团队信息
    console.log('\n2️⃣ 测试获取团队信息...');
    const profileResponse = await fetch(`${BASE_URL}/api/teams/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error(`获取团队信息失败: ${profileResponse.status}`);
    }

    const profileData = await profileResponse.json();
    if (!profileData.success) {
      throw new Error(`获取团队信息失败: ${profileData.error}`);
    }

    console.log('✅ 获取团队信息成功');
    console.log(`   团队ID: ${profileData.team.id}`);
    console.log(`   团队名称: ${profileData.team.team_name}`);

    // 3. 测试获取提交记录
    console.log('\n3️⃣ 测试获取提交记录...');
    const submissionsResponse = await fetch(`${BASE_URL}/api/teams/submissions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!submissionsResponse.ok) {
      throw new Error(`获取提交记录失败: ${submissionsResponse.status}`);
    }

    const submissionsData = await submissionsResponse.json();
    if (!submissionsData.success) {
      throw new Error(`获取提交记录失败: ${submissionsData.error}`);
    }

    console.log('✅ 获取提交记录成功');
    console.log(`   提交记录数量: ${submissionsData.submissions.length}`);

    // 4. 测试获取图片列表
    console.log('\n4️⃣ 测试获取图片列表...');
    const imagesResponse = await fetch(`${BASE_URL}/api/teams/images`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!imagesResponse.ok) {
      throw new Error(`获取图片列表失败: ${imagesResponse.status}`);
    }

    const imagesData = await imagesResponse.json();
    if (!imagesData.success) {
      throw new Error(`获取图片列表失败: ${imagesData.error}`);
    }

    console.log('✅ 获取图片列表成功');
    console.log(`   图片数量: ${imagesData.images.length}`);

    // 5. 测试文档下载（如果有文档）
    if (submissionsData.submissions.length > 0) {
      console.log('\n5️⃣ 测试文档下载...');
      const firstDoc = submissionsData.submissions[0];
      const downloadResponse = await fetch(`${BASE_URL}/api/teams/download/${firstDoc.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (downloadResponse.ok) {
        console.log('✅ 文档下载成功');
        console.log(`   文档类型: ${downloadResponse.headers.get('content-type')}`);
      } else {
        console.log(`❌ 文档下载失败: ${downloadResponse.status}`);
      }
    }

    // 6. 测试图片下载（如果有图片）
    if (imagesData.images.length > 0) {
      console.log('\n6️⃣ 测试图片下载...');
      const firstImage = imagesData.images[0];
      const imageDownloadResponse = await fetch(`${BASE_URL}/api/teams/download-image/${firstImage.id}?token=${token}`);

      if (imageDownloadResponse.ok) {
        console.log('✅ 图片下载成功');
        console.log(`   图片类型: ${imageDownloadResponse.headers.get('content-type')}`);
      } else {
        console.log(`❌ 图片下载失败: ${imageDownloadResponse.status}`);
      }
    }

    console.log('\n🎉 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
testTeamDashboard();
