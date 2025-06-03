#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
覆盖率报告合并脚本
用于合并Jest和Python测试的覆盖率报告，生成整体项目覆盖率统计
"""

import json
import xml.etree.ElementTree as ET
import os
import sys
import argparse
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np

# 默认覆盖率报告路径
DEFAULT_JEST_COVERAGE = 'coverage/jest/coverage-summary.json'
DEFAULT_PYTHON_COVERAGE = 'coverage/python/coverage.xml'
DEFAULT_OUTPUT_DIR = 'coverage/merged'

def parse_jest_coverage(file_path):
    """解析Jest覆盖率报告"""
    try:
        # 如果文件不存在，尝试从coverage-final.json创建
        if not os.path.exists(file_path):
            print(f"警告: {file_path} 不存在，尝试从coverage-final.json创建...")
            final_json_path = os.path.join(os.path.dirname(file_path), 'coverage-final.json')
            if os.path.exists(final_json_path):
                try:
                    with open(final_json_path, 'r', encoding='utf-8') as f:
                        final_data = json.load(f)
                    
                    # 创建summary格式数据
                    summary_data = {"total": {
                        "lines": {"total": 0, "covered": 0, "skipped": 0, "pct": 0},
                        "statements": {"total": 0, "covered": 0, "skipped": 0, "pct": 0},
                        "functions": {"total": 0, "covered": 0, "skipped": 0, "pct": 0},
                        "branches": {"total": 0, "covered": 0, "skipped": 0, "pct": 0}
                    }}
                    
                    # 处理每个文件的数据
                    for file_path, file_data in final_data.items():
                        if file_path == 'total':
                            continue
                            
                        file_summary = {
                            "lines": {"total": 0, "covered": 0, "skipped": 0, "pct": 0},
                            "statements": {"total": 0, "covered": 0, "skipped": 0, "pct": 0},
                            "functions": {"total": 0, "covered": 0, "skipped": 0, "pct": 0},
                            "branches": {"total": 0, "covered": 0, "skipped": 0, "pct": 0}
                        }
                        
                        # 计算行覆盖率
                        if 'statementMap' in file_data and 's' in file_data:
                            total_stmts = len(file_data['statementMap'])
                            covered_stmts = sum(1 for v in file_data['s'].values() if v > 0)
                            pct = (covered_stmts / total_stmts * 100) if total_stmts > 0 else 0
                            
                            file_summary['statements'] = {
                                "total": total_stmts,
                                "covered": covered_stmts,
                                "skipped": 0,
                                "pct": pct
                            }
                            summary_data['total']['statements']['total'] += total_stmts
                            summary_data['total']['statements']['covered'] += covered_stmts
                        
                        # 计算函数覆盖率
                        if 'fnMap' in file_data and 'f' in file_data:
                            total_fns = len(file_data['fnMap'])
                            covered_fns = sum(1 for v in file_data['f'].values() if v > 0)
                            pct = (covered_fns / total_fns * 100) if total_fns > 0 else 0
                            
                            file_summary['functions'] = {
                                "total": total_fns,
                                "covered": covered_fns,
                                "skipped": 0,
                                "pct": pct
                            }
                            summary_data['total']['functions']['total'] += total_fns
                            summary_data['total']['functions']['covered'] += covered_fns
                        
                        # 计算分支覆盖率
                        if 'branchMap' in file_data and 'b' in file_data:
                            total_branches = sum(len(v) for v in file_data['b'].values())
                            covered_branches = sum(sum(1 for hit in branch if hit > 0) for branch in file_data['b'].values())
                            pct = (covered_branches / total_branches * 100) if total_branches > 0 else 0
                            
                            file_summary['branches'] = {
                                "total": total_branches,
                                "covered": covered_branches,
                                "skipped": 0,
                                "pct": pct
                            }
                            summary_data['total']['branches']['total'] += total_branches
                            summary_data['total']['branches']['covered'] += covered_branches
                        
                        # 设置行覆盖率与语句覆盖率相同
                        file_summary['lines'] = file_summary['statements'].copy()
                        summary_data['total']['lines'] = summary_data['total']['statements'].copy()
                        
                        summary_data[file_path] = file_summary
                    
                    # 计算总体百分比
                    for metric in ['statements', 'branches', 'functions', 'lines']:
                        total = summary_data['total'][metric]['total']
                        covered = summary_data['total'][metric]['covered']
                        summary_data['total'][metric]['pct'] = (covered / total * 100) if total > 0 else 0
                    
                    # 保存生成的summary文件
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)
                    with open(file_path, 'w', encoding='utf-8') as f:
                        json.dump(summary_data, f, indent=2)
                    
                    print(f"成功从coverage-final.json创建了{file_path}")
                except Exception as e:
                    print(f"从coverage-final.json创建summary文件失败: {e}")
                    # 创建一个空的覆盖率报告
                    create_empty_jest_coverage(file_path)
            else:
                print(f"警告: coverage-final.json也不存在，创建空的覆盖率报告")
                create_empty_jest_coverage(file_path)
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        js_total = data['total']
        
        # 获取文件级别的覆盖率数据
        files_data = {}
        for key, value in data.items():
            if key != 'total':
                files_data[key] = value
        
        return {
            'lines': js_total['lines']['pct'],
            'statements': js_total['statements']['pct'],
            'functions': js_total['functions']['pct'],
            'branches': js_total['branches']['pct'],
            'files_count': len(files_data),
            'files_data': files_data
        }
    except Exception as e:
        print(f"解析Jest覆盖率报告出错: {e}")
        return {
            'lines': 0,
            'statements': 0,
            'functions': 0,
            'branches': 0,
            'files_count': 0,
            'files_data': {}
        }

def create_empty_jest_coverage(file_path):
    """创建空的Jest覆盖率报告"""
    empty_data = {
        "total": {
            "lines": {"total": 0, "covered": 0, "skipped": 0, "pct": 0},
            "statements": {"total": 0, "covered": 0, "skipped": 0, "pct": 0},
            "functions": {"total": 0, "covered": 0, "skipped": 0, "pct": 0},
            "branches": {"total": 0, "covered": 0, "skipped": 0, "pct": 0}
        }
    }
    
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(empty_data, f, indent=2)
    print(f"创建了空的Jest覆盖率报告: {file_path}")

def parse_python_coverage(file_path):
    """解析Python覆盖率报告"""
    try:
        if not os.path.exists(file_path):
            print(f"警告: {file_path} 不存在，创建空的覆盖率报告")
            create_empty_python_coverage(file_path)
            
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        # 调试输出
        print(f"解析Python覆盖率报告: {file_path}")
        print(f"XML根元素标签: {root.tag}")
        print(f"XML根元素属性: {root.attrib}")
        
        # 直接使用根元素作为coverage元素
        if root.tag == 'coverage':
            coverage = root
            print("使用根元素作为coverage元素")
        else:
            coverage = root.find('coverage')
            
        if coverage is None:
            print("警告: coverage元素不存在，创建空的覆盖率报告")
            return {
                'lines': 0,
                'branches': 0,
                'files_count': 0,
                'files_data': {}
            }
        
        # 调试输出    
        print(f"找到coverage元素: {coverage.attrib}")
        
        # 从coverage属性中直接获取line-rate和branch-rate
        line_rate = float(coverage.get('line-rate', 0)) * 100
        branch_rate = float(coverage.get('branch-rate', 0)) * 100
        
        print(f"解析到的行覆盖率: {line_rate}%, 分支覆盖率: {branch_rate}%")
        
        # 查找所有类文件
        classes = coverage.findall('.//class')
        files_count = len(classes)
        
        print(f"找到 {files_count} 个类文件")
        
        # 获取文件级别的覆盖率数据
        files_data = {}
        for cls in classes:
            filename = cls.get('filename')
            line_rate_file = float(cls.get('line-rate', 0)) * 100
            branch_rate_file = float(cls.get('branch-rate', 0)) * 100
            
            print(f"文件 {filename}: 行覆盖率 {line_rate_file}%, 分支覆盖率 {branch_rate_file}%")
            
            files_data[filename] = {
                'lines': {'pct': line_rate_file},
                'branches': {'pct': branch_rate_file}
            }
        
        return {
            'lines': line_rate,
            'branches': branch_rate,
            'files_count': files_count,
            'files_data': files_data
        }
    except Exception as e:
        print(f"解析Python覆盖率报告出错: {e}")
        import traceback
        traceback.print_exc()
        return {
            'lines': 0,
            'branches': 0,
            'files_count': 0,
            'files_data': {}
        }

def create_empty_python_coverage(file_path):
    """创建空的Python覆盖率报告"""
    empty_xml = """<?xml version="1.0" ?>
<coverage version="5.5" timestamp="1617123456" lines-valid="0" lines-covered="0" line-rate="0" branches-covered="0" branches-valid="0" branch-rate="0" complexity="0">
    <sources>
        <source>.</source>
    </sources>
    <packages>
    </packages>
</coverage>
"""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(empty_xml)
    print(f"创建了空的Python覆盖率报告: {file_path}")

def calculate_weighted_average(js_cov, py_cov):
    """计算加权平均覆盖率"""
    total_files = js_cov['files_count'] + py_cov['files_count']
    
    if total_files == 0:
        return {
            'lines': 0,
            'branches': 0,
            'total_files': 0
        }
    
    weighted_line_cov = ((js_cov['lines'] * js_cov['files_count']) + 
                         (py_cov['lines'] * py_cov['files_count'])) / total_files
    
    weighted_branch_cov = ((js_cov['branches'] * js_cov['files_count']) + 
                          (py_cov['branches'] * py_cov['files_count'])) / total_files
    
    return {
        'lines': weighted_line_cov,
        'branches': weighted_branch_cov,
        'total_files': total_files
    }

def generate_text_report(js_coverage, py_coverage, combined):
    """生成文本格式的覆盖率报告"""
    report = []
    report.append("===== 卡牌游戏项目覆盖率报告 =====")
    report.append(f"总文件数: {combined['total_files']}")
    report.append(f"JavaScript文件: {js_coverage['files_count']}")
    report.append(f"Python文件: {py_coverage['files_count']}")
    report.append("\n--- JavaScript覆盖率 ---")
    report.append(f"行覆盖率: {js_coverage['lines']:.2f}%")
    report.append(f"语句覆盖率: {js_coverage['statements']:.2f}%")
    report.append(f"函数覆盖率: {js_coverage['functions']:.2f}%")
    report.append(f"分支覆盖率: {js_coverage['branches']:.2f}%")
    report.append("\n--- Python覆盖率 ---")
    report.append(f"行覆盖率: {py_coverage['lines']:.2f}%")
    report.append(f"分支覆盖率: {py_coverage['branches']:.2f}%")
    report.append("\n--- 整体加权覆盖率 ---")
    report.append(f"行覆盖率: {combined['lines']:.2f}%")
    report.append(f"分支覆盖率: {combined['branches']:.2f}%")
    
    return "\n".join(report)

def generate_html_report(js_coverage, py_coverage, combined, output_dir):
    """生成HTML格式的覆盖率报告"""
    try:
        # 获取颜色类别
        def get_color_class(value):
            if value >= 80:
                return "good"
            elif value >= 60:
                return "warning"
            else:
                return "danger"
        
        # 生成文件行
        file_rows = []
        
        # 处理JavaScript文件
        for file_path, file_data in js_coverage['files_data'].items():
            if isinstance(file_data, dict) and 'lines' in file_data and isinstance(file_data['lines'], dict) and 'pct' in file_data['lines']:
                pct = file_data['lines']['pct']
                color_class = get_color_class(pct)
                file_rows.append(f"""
                <tr>
                    <td>{file_path}</td>
                    <td>{pct:.2f}%</td>
                    <td>
                        <div class="progress-bar-container">
                            <div class="progress-bar {color_class}" style="width: {min(pct, 100)}%;"></div>
                        </div>
                    </td>
                </tr>
                """)
        
        # 处理Python文件
        for file_path, file_data in py_coverage['files_data'].items():
            if isinstance(file_data, dict) and 'lines' in file_data and isinstance(file_data['lines'], dict) and 'pct' in file_data['lines']:
                pct = file_data['lines']['pct']
                color_class = get_color_class(pct)
                file_rows.append(f"""
                <tr>
                    <td>{file_path}</td>
                    <td>{pct:.2f}%</td>
                    <td>
                        <div class="progress-bar-container">
                            <div class="progress-bar {color_class}" style="width: {min(pct, 100)}%;"></div>
                        </div>
                    </td>
                </tr>
                """)
        
        # 生成HTML内容
        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>卡牌游戏项目覆盖率报告</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        h1 {{
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #2980b9;
            margin-top: 30px;
        }}
        .summary {{
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }}
        .coverage-section {{
            margin-bottom: 30px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }}
        th, td {{
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        th {{
            background-color: #f2f2f2;
        }}
        .progress-bar-container {{
            width: 200px;
            height: 20px;
            background-color: #ecf0f1;
            border-radius: 10px;
            overflow: hidden;
        }}
        .progress-bar {{
            height: 100%;
            border-radius: 10px;
        }}
        .good {{
            background-color: #2ecc71;
        }}
        .warning {{
            background-color: #f39c12;
        }}
        .danger {{
            background-color: #e74c3c;
        }}
        .chart-container {{
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            margin: 30px 0;
        }}
        .chart {{
            width: 45%;
            min-width: 400px;
            height: 300px;
            margin-bottom: 20px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>卡牌游戏项目覆盖率报告</h1>
        
        <div class="summary">
            <h2>项目概览</h2>
            <p>总文件数: {combined['total_files']}</p>
            <p>JavaScript文件: {js_coverage['files_count']}</p>
            <p>Python文件: {py_coverage['files_count']}</p>
        </div>
        
        <div class="coverage-section">
            <h2>整体加权覆盖率</h2>
            <table>
                <tr>
                    <th>指标</th>
                    <th>覆盖率</th>
                    <th>可视化</th>
                </tr>
                <tr>
                    <td>行覆盖率</td>
                    <td>{combined['lines']:.2f}%</td>
                    <td>
                        <div class="progress-bar-container">
                            <div class="progress-bar {get_color_class(combined['lines'])}" style="width: {min(combined['lines'], 100)}%;"></div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>分支覆盖率</td>
                    <td>{combined['branches']:.2f}%</td>
                    <td>
                        <div class="progress-bar-container">
                            <div class="progress-bar {get_color_class(combined['branches'])}" style="width: {min(combined['branches'], 100)}%;"></div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
        
        <div class="coverage-section">
            <h2>JavaScript覆盖率</h2>
            <table>
                <tr>
                    <th>指标</th>
                    <th>覆盖率</th>
                    <th>可视化</th>
                </tr>
                <tr>
                    <td>行覆盖率</td>
                    <td>{js_coverage['lines']:.2f}%</td>
                    <td>
                        <div class="progress-bar-container">
                            <div class="progress-bar {get_color_class(js_coverage['lines'])}" style="width: {min(js_coverage['lines'], 100)}%;"></div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>语句覆盖率</td>
                    <td>{js_coverage['statements']:.2f}%</td>
                    <td>
                        <div class="progress-bar-container">
                            <div class="progress-bar {get_color_class(js_coverage['statements'])}" style="width: {min(js_coverage['statements'], 100)}%;"></div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>函数覆盖率</td>
                    <td>{js_coverage['functions']:.2f}%</td>
                    <td>
                        <div class="progress-bar-container">
                            <div class="progress-bar {get_color_class(js_coverage['functions'])}" style="width: {min(js_coverage['functions'], 100)}%;"></div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>分支覆盖率</td>
                    <td>{js_coverage['branches']:.2f}%</td>
                    <td>
                        <div class="progress-bar-container">
                            <div class="progress-bar {get_color_class(js_coverage['branches'])}" style="width: {min(js_coverage['branches'], 100)}%;"></div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
        
        <div class="coverage-section">
            <h2>Python覆盖率</h2>
            <table>
                <tr>
                    <th>指标</th>
                    <th>覆盖率</th>
                    <th>可视化</th>
                </tr>
                <tr>
                    <td>行覆盖率</td>
                    <td>{py_coverage['lines']:.2f}%</td>
                    <td>
                        <div class="progress-bar-container">
                            <div class="progress-bar {get_color_class(py_coverage['lines'])}" style="width: {min(py_coverage['lines'], 100)}%;"></div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>分支覆盖率</td>
                    <td>{py_coverage['branches']:.2f}%</td>
                    <td>
                        <div class="progress-bar-container">
                            <div class="progress-bar {get_color_class(py_coverage['branches'])}" style="width: {min(py_coverage['branches'], 100)}%;"></div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
        
        <div class="coverage-section">
            <h2>文件详情</h2>
            <table>
                <tr>
                    <th>文件</th>
                    <th>行覆盖率</th>
                    <th>可视化</th>
                </tr>
                {"".join(file_rows)}
            </table>
        </div>
    </div>
</body>
</html>
"""
        
        # 确保输出目录存在
        os.makedirs(output_dir, exist_ok=True)
        
        # 写入HTML文件
        html_path = os.path.join(output_dir, 'index.html')
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        # 生成图表
        try:
            generate_charts(js_coverage, py_coverage, combined, output_dir)
        except Exception as e:
            print(f"生成图表失败: {e}")
            print("提示: 图表生成需要matplotlib库，请运行 'pip install matplotlib' 安装")
        
        return html_path
    except Exception as e:
        print(f"生成HTML报告失败: {e}")
        import traceback
        traceback.print_exc()
        print("提示: HTML报告需要matplotlib库，请运行 'pip install matplotlib' 安装")
        return None

def generate_charts(js_coverage, py_coverage, combined, output_dir):
    """生成覆盖率图表"""
    try:
        # 覆盖率比较图
        plt.figure(figsize=(10, 6))
        
        # 数据
        categories = ['行覆盖率', '分支覆盖率']
        js_values = [js_coverage['lines'], js_coverage['branches']]
        py_values = [py_coverage['lines'], py_coverage['branches']]
        combined_values = [combined['lines'], combined['branches']]
        
        # 设置柱状图位置
        x = np.arange(len(categories))
        width = 0.25
        
        # 绘制柱状图
        plt.bar(x - width, js_values, width, label='JavaScript', color='#3498db')
        plt.bar(x, py_values, width, label='Python', color='#2ecc71')
        plt.bar(x + width, combined_values, width, label='整体', color='#9b59b6')
        
        # 添加标签和标题
        plt.xlabel('覆盖率类型')
        plt.ylabel('覆盖率百分比 (%)')
        plt.title('JavaScript vs Python 覆盖率比较')
        plt.xticks(x, categories)
        plt.ylim(0, 100)
        plt.legend()
        plt.grid(axis='y', linestyle='--', alpha=0.7)
        
        # 保存图表
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, 'coverage_comparison.png'))
        plt.close()
        
        # 文件分布饼图
        plt.figure(figsize=(8, 8))
        
        # 数据
        labels = ['JavaScript文件', 'Python文件']
        sizes = [js_coverage['files_count'], py_coverage['files_count']]
        colors = ['#3498db', '#2ecc71']
        explode = (0.1, 0)  # 突出显示JavaScript部分
        
        # 绘制饼图
        plt.pie(sizes, explode=explode, labels=labels, colors=colors,
                autopct='%1.1f%%', shadow=True, startangle=140)
        plt.axis('equal')  # 保持饼图为圆形
        plt.title('项目文件类型分布')
        
        # 保存图表
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, 'file_distribution.png'))
        plt.close()
        
    except Exception as e:
        print(f"生成图表时出错: {e}")

def generate_json_report(js_coverage, py_coverage, combined, output_dir):
    """生成JSON格式的覆盖率报告"""
    report = {
        'summary': {
            'total_files': combined['total_files'],
            'javascript_files': js_coverage['files_count'],
            'python_files': py_coverage['files_count'],
        },
        'javascript': {
            'lines': js_coverage['lines'],
            'statements': js_coverage['statements'],
            'functions': js_coverage['functions'],
            'branches': js_coverage['branches'],
        },
        'python': {
            'lines': py_coverage['lines'],
            'branches': py_coverage['branches'],
        },
        'combined': {
            'lines': combined['lines'],
            'branches': combined['branches'],
        }
    }
    
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    # 写入JSON文件
    with open(os.path.join(output_dir, 'coverage-summary.json'), 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)
    
    return os.path.join(output_dir, 'coverage-summary.json')

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='合并Jest和Python测试覆盖率报告')
    parser.add_argument('--jest', default=DEFAULT_JEST_COVERAGE, help='Jest覆盖率报告路径')
    parser.add_argument('--python', default=DEFAULT_PYTHON_COVERAGE, help='Python覆盖率报告路径')
    parser.add_argument('--output', default=DEFAULT_OUTPUT_DIR, help='输出目录')
    parser.add_argument('--format', choices=['text', 'html', 'json', 'all'], default='all', help='输出格式')
    args = parser.parse_args()
    
    # 确保输出目录存在
    os.makedirs(args.output, exist_ok=True)
    
    try:
        # 解析覆盖率报告
        js_coverage = parse_jest_coverage(args.jest)
        py_coverage = parse_python_coverage(args.python)
        
        # 计算合并覆盖率
        combined = calculate_weighted_average(js_coverage, py_coverage)
        
        # 根据指定格式生成报告
        if args.format in ['text', 'all']:
            text_report = generate_text_report(js_coverage, py_coverage, combined)
            text_path = os.path.join(args.output, 'coverage-summary.txt')
            with open(text_path, 'w', encoding='utf-8') as f:
                f.write(text_report)
            print(f"文本报告已保存到: {text_path}")
            
            # 同时在控制台显示
            print("\n" + text_report + "\n")
        
        if args.format in ['html', 'all']:
            try:
                html_path = generate_html_report(js_coverage, py_coverage, combined, args.output)
                print(f"HTML报告已保存到: {html_path}")
            except Exception as e:
                print(f"生成HTML报告失败: {e}")
                print("提示: HTML报告需要matplotlib库，请运行 'pip install matplotlib' 安装")
        
        if args.format in ['json', 'all']:
            json_path = generate_json_report(js_coverage, py_coverage, combined, args.output)
            print(f"JSON报告已保存到: {json_path}")
        
        return 0
    
    except Exception as e:
        print(f"错误: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 