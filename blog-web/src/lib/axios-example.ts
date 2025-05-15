import http from './axios';

/**
 * 示例：如何使用封装好的HTTP请求方法
 * 注意：baseURL已在axios.ts中设置为http://121.62.28.11:8080/api
 * 所以这里只需要提供相对路径即可
 */

// 示例1：发送GET请求到 http://121.62.28.11:8080/api/test
async function getExample() {
  try {
    // 只需提供相对路径'/test'，不需要完整URL
    const response = await http.get('/test');
    console.log('GET请求响应:', response);
    return response;
  } catch (error) {
    console.error('GET请求失败:', error);
    throw error;
  }
}

// 示例2：发送POST请求到 http://121.62.28.11:8080/api/users
async function postExample() {
  try {
    const data = {
      username: 'test_user',
      email: 'test@example.com'
    };
    // 只需提供相对路径'/users'，不需要完整URL
    const response = await http.post('/users', data);
    console.log('POST请求响应:', response);
    return response;
  } catch (error) {
    console.error('POST请求失败:', error);
    throw error;
  }
}

// 示例3：发送带认证token的GET请求
async function getWithTokenExample() {
  try {
    // 通过withToken参数指定是否需要在请求头中添加token
    const response = await http.get('/user/profile', {}, { withToken: true });
    console.log('带Token的GET请求响应:', response);
    return response;
  } catch (error) {
    console.error('带Token的GET请求失败:', error);
    throw error;
  }
}

// 导出示例函数
export {
  getExample,
  postExample,
  getWithTokenExample
};