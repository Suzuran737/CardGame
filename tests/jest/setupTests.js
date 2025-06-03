// 导入jest-dom扩展断言
import '@testing-library/jest-dom';

// 模拟全局浏览器对象
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// 模拟document.getElementById等方法
document.getElementById = jest.fn();
document.querySelector = jest.fn();
document.querySelectorAll = jest.fn(() => []);

// 模拟console方法
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// 重置所有模拟在每次测试之前
beforeEach(() => {
  jest.clearAllMocks();
}); 