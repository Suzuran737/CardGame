#!/usr/bin/env python
"""
卡牌游戏性能测试入口脚本
运行方式: python tests/test_performance/run_performance_tests.py
"""
import os
import sys
import argparse
import subprocess
from pathlib import Path

# 获取当前脚本目录
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# 获取项目根目录
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
# 添加项目根目录到Python路径
sys.path.insert(0, ROOT_DIR)

def run_api_response_tests():
    """运行API响应时间测试"""
    print("\n=== 运行API响应时间测试 ===")
    result = subprocess.run([
        "pytest",
        os.path.join(SCRIPT_DIR, "test_api_response.py"),
        "-v",
        "--benchmark-only",
        "--benchmark-sort=name",
        "--benchmark-columns=min,max,mean,stddev"
    ])
    return result.returncode

def run_concurrent_request_tests():
    """运行并发请求测试"""
    print("\n=== 运行并发请求测试 ===")
    result = subprocess.run([
        "pytest",
        os.path.join(SCRIPT_DIR, "test_concurrent_requests.py"),
        "-v"
    ])
    return result.returncode

def run_data_loading_tests():
    """运行数据加载性能测试"""
    print("\n=== 运行数据加载性能测试 ===")
    result = subprocess.run([
        "pytest",
        os.path.join(SCRIPT_DIR, "test_data_loading.py"),
        "-v"
    ])
    return result.returncode

def run_user_experience_test():
    """运行用户体验模拟测试（简易版）"""
    print("\n=== 运行用户体验模拟测试（简易版） ===")
    result = subprocess.run([
        "pytest",
        os.path.join(SCRIPT_DIR, "test_user_experience.py"),
        "-v",
        "-k",
        "not skip"  # 排除标记为skip的测试
    ])
    return result.returncode

def generate_locust_config():
    """生成Locust配置文件"""
    print("\n=== 生成Locust配置文件 ===")
    result = subprocess.run([
        "pytest",
        os.path.join(SCRIPT_DIR, "test_user_experience.py::TestUserExperienceSimulation::test_generate_locust_config"),
        "-v"
    ])
    return result.returncode

def run_locust_test(headless=True, users=10, spawn_rate=1, run_time="30s", host="http://localhost:5000"):
    """运行Locust负载测试"""
    print(f"\n=== 运行Locust负载测试: {users}用户, {spawn_rate}用户/秒, {run_time}运行时间 ===")
    
    cmd = [
        "locust",
        "-f", os.path.join(SCRIPT_DIR, "test_user_experience.py"),
        "--host", host,
        "--users", str(users),
        "--spawn-rate", str(spawn_rate),
        "--run-time", run_time,
    ]
    
    if headless:
        cmd.append("--headless")
        cmd.extend(["--html", os.path.join(ROOT_DIR, "locust_report.html")])
    
    result = subprocess.run(cmd)
    return result.returncode

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="卡牌游戏性能测试工具")
    parser.add_argument("--api", action="store_true", help="运行API响应时间测试")
    parser.add_argument("--concurrent", action="store_true", help="运行并发请求测试")
    parser.add_argument("--loading", action="store_true", help="运行数据加载性能测试")
    parser.add_argument("--user-experience", action="store_true", help="运行用户体验模拟测试（简易版）")
    parser.add_argument("--locust", action="store_true", help="运行Locust负载测试")
    parser.add_argument("--locust-ui", action="store_true", help="运行Locust负载测试（带UI界面）")
    parser.add_argument("--users", type=int, default=10, help="Locust测试用户数")
    parser.add_argument("--spawn-rate", type=int, default=1, help="Locust每秒产生的用户数")
    parser.add_argument("--run-time", type=str, default="30s", help="Locust运行时间")
    parser.add_argument("--host", type=str, default="http://localhost:5000", help="测试目标主机")
    parser.add_argument("--all", action="store_true", help="运行所有测试")
    
    args = parser.parse_args()
    
    # 如果没有指定任何选项，显示帮助信息
    if not any(vars(args).values()):
        parser.print_help()
        return 1
    
    exit_code = 0
    
    # 运行指定的测试
    if args.api or args.all:
        api_exit_code = run_api_response_tests()
        exit_code = exit_code or api_exit_code
    
    if args.concurrent or args.all:
        concurrent_exit_code = run_concurrent_request_tests()
        exit_code = exit_code or concurrent_exit_code
    
    if args.loading or args.all:
        loading_exit_code = run_data_loading_tests()
        exit_code = exit_code or loading_exit_code
    
    if args.user_experience or args.all:
        ux_exit_code = run_user_experience_test()
        exit_code = exit_code or ux_exit_code
    
    if args.locust or args.locust_ui or args.all:
        # 生成Locust配置文件
        generate_locust_config()
        # 运行Locust测试
        locust_exit_code = run_locust_test(
            headless=not args.locust_ui,
            users=args.users,
            spawn_rate=args.spawn_rate,
            run_time=args.run_time,
            host=args.host
        )
        exit_code = exit_code or locust_exit_code
    
    return exit_code

if __name__ == "__main__":
    sys.exit(main()) 