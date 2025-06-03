module.exports = {
  // 使用jsdom环境模拟浏览器环境
  testEnvironment: 'jsdom',
  // 使用babel-jest转换JavaScript文件
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  // 模块名称映射，用于处理静态资源导入
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/jest/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/tests/jest/fileMock.js'
  },
  // 测试文件的匹配模式 - 修改以包含battle目录
  testMatch: [
    '**/tests/jest/**/*.test.js',
    '**/tests/battle/**/*.test.js'
  ],
  // 排除特定测试文件
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  // 在每个测试文件之前自动运行的设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/jest/setupTests.js'],
  // 指定需要覆盖率报告的文件 - 只包含适配器文件
  collectCoverageFrom: [
    'static/js/battle/*-adapter.js',
    '!**/*.config.js',
    '!**/node_modules/**'
  ],
  // 覆盖率报告格式
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'json-summary'],
  // 覆盖率输出目录
  coverageDirectory: 'coverage/jest'
}; 