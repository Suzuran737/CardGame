import pytest
import threading
import time
import queue
from flask import Flask

@pytest.fixture
def client(app):
    """创建一个测试客户端"""
    return app.test_client()

class TestConcurrentRequests:
    """并发请求测试类"""
    
    def test_concurrent_card_get_requests(self, client):
        """测试并发获取卡牌列表请求"""
        num_threads = 10
        results = queue.Queue()
        
        def worker():
            start_time = time.time()
            response = client.get('/api/cards')
            end_time = time.time()
            results.put((response.status_code, end_time - start_time))
        
        # 创建并启动线程
        threads = []
        for _ in range(num_threads):
            thread = threading.Thread(target=worker)
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 收集结果
        response_times = []
        error_count = 0
        
        for _ in range(num_threads):
            status_code, response_time = results.get()
            response_times.append(response_time)
            if status_code != 200:
                error_count += 1
        
        # 分析结果
        avg_response_time = sum(response_times) / len(response_times)
        max_response_time = max(response_times)
        min_response_time = min(response_times)
        
        print(f"\n并发卡牌请求测试结果:")
        print(f"平均响应时间: {avg_response_time:.4f} 秒")
        print(f"最大响应时间: {max_response_time:.4f} 秒")
        print(f"最小响应时间: {min_response_time:.4f} 秒")
        print(f"错误请求数: {error_count}")
        
        # 确保所有请求都成功
        assert error_count == 0, f"有 {error_count} 个请求失败"
        # 确保平均响应时间在合理范围内
        assert avg_response_time < 1.0, f"平均响应时间 {avg_response_time:.4f} 秒太长"
    
    def test_concurrent_deck_get_requests(self, client):
        """测试并发获取牌组列表请求"""
        num_threads = 10
        results = queue.Queue()
        
        def worker():
            start_time = time.time()
            response = client.get('/api/decks')
            end_time = time.time()
            results.put((response.status_code, end_time - start_time))
        
        # 创建并启动线程
        threads = []
        for _ in range(num_threads):
            thread = threading.Thread(target=worker)
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 收集结果
        response_times = []
        error_count = 0
        
        for _ in range(num_threads):
            status_code, response_time = results.get()
            response_times.append(response_time)
            if status_code != 200:
                error_count += 1
        
        # 分析结果
        avg_response_time = sum(response_times) / len(response_times)
        max_response_time = max(response_times)
        min_response_time = min(response_times)
        
        print(f"\n并发牌组请求测试结果:")
        print(f"平均响应时间: {avg_response_time:.4f} 秒")
        print(f"最大响应时间: {max_response_time:.4f} 秒")
        print(f"最小响应时间: {min_response_time:.4f} 秒")
        print(f"错误请求数: {error_count}")
        
        # 确保所有请求都成功
        assert error_count == 0, f"有 {error_count} 个请求失败"
        # 确保平均响应时间在合理范围内
        assert avg_response_time < 1.0, f"平均响应时间 {avg_response_time:.4f} 秒太长"
        
    def test_concurrent_mixed_requests(self, client):
        """测试混合读写并发请求"""
        num_threads = 20
        results = queue.Queue()
        
        def read_worker(endpoint):
            start_time = time.time()
            response = client.get(f'/api/{endpoint}')
            end_time = time.time()
            results.put(('read', response.status_code, end_time - start_time))
            
        def write_worker(endpoint, data):
            import json
            start_time = time.time()
            response = client.post(
                f'/api/{endpoint}',
                data=json.dumps(data),
                content_type='application/json'
            )
            end_time = time.time()
            results.put(('write', response.status_code, end_time - start_time))
        
        # 创建并启动线程
        threads = []
        
        # 创建一些读请求
        for i in range(num_threads // 2):
            endpoint = "cards" if i % 2 == 0 else "decks"
            thread = threading.Thread(target=read_worker, args=(endpoint,))
            threads.append(thread)
            thread.start()
        
        # 创建一些写请求
        for i in range(num_threads // 2):
            if i % 2 == 0:
                endpoint = "cards"
                data = {
                    "name": f"测试卡牌{i}",
                    "description": "这是一张测试卡牌",
                    "type": "生物",
                    "cost": 3,
                    "attack": 2,
                    "health": 2,
                    "image_url": "/static/images/default_card.png"
                }
            else:
                endpoint = "decks"
                data = {
                    "name": f"测试牌组{i}",
                    "cards": []
                }
            
            thread = threading.Thread(target=write_worker, args=(endpoint, data))
            threads.append(thread)
            thread.start()
        
        # 等待所有线程完成
        for thread in threads:
            thread.join()
        
        # 收集结果
        read_times = []
        write_times = []
        read_errors = 0
        write_errors = 0
        
        for _ in range(num_threads):
            op_type, status_code, response_time = results.get()
            if op_type == 'read':
                read_times.append(response_time)
                if status_code != 200:
                    read_errors += 1
            else:  # write
                write_times.append(response_time)
                if status_code not in [200, 201]:
                    write_errors += 1
        
        # 分析结果
        avg_read_time = sum(read_times) / len(read_times) if read_times else 0
        avg_write_time = sum(write_times) / len(write_times) if write_times else 0
        
        print(f"\n混合并发请求测试结果:")
        print(f"平均读取响应时间: {avg_read_time:.4f} 秒")
        print(f"平均写入响应时间: {avg_write_time:.4f} 秒")
        print(f"读取错误数: {read_errors}")
        print(f"写入错误数: {write_errors}")
        
        # 验证结果
        # 读取请求不应该有错误
        assert read_errors == 0, f"有 {read_errors} 个读取请求失败"
        # 读取响应时间应该合理
        assert avg_read_time < 1.0, f"平均读取响应时间 {avg_read_time:.4f} 秒太长"
        # 写入响应时间应该合理，但可能比读取慢
        assert avg_write_time < 2.0, f"平均写入响应时间 {avg_write_time:.4f} 秒太长" 