#!/usr/bin/env python3
"""
Planner Agent 工具函式
提供給 LangChain Agent 使用的工具
"""

import json
import os
import sys
from typing import List, Dict, Any, Optional
from pathlib import Path

# 添加路徑
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from langchain_core.tools import tool

# 全局變量存儲食譜數據
_recipes_data = None

def _load_recipes_data():
    """載入食譜數據（延遲載入）"""
    global _recipes_data
    if _recipes_data is None:
        try:
            recipes_file = os.path.join(os.path.dirname(__file__), "data", "recipes.json")
            if os.path.exists(recipes_file):
                with open(recipes_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    _recipes_data = {
                        'recipes': data.get('recipes', []),
                        'pairings': data.get('pairings', [])
                    }
                print(f"載入 {len(_recipes_data['recipes'])} 個食譜和 {len(_recipes_data['pairings'])} 個搭配")
            else:
                print(f"資料檔案 {recipes_file} 不存在")
                _recipes_data = {'recipes': [], 'pairings': []}
        except Exception as e:
            print(f"載入資料失敗: {e}")
            _recipes_data = {'recipes': [], 'pairings': []}
    return _recipes_data

def _search_by_ingredients(ingredients, max_results=10):
    """根據食材搜尋食譜"""
    data = _load_recipes_data()
    recipes = data['recipes']
    
    results = []
    for recipe in recipes:
        recipe_ingredients = [ing.get('name', '').lower() for ing in recipe.get('ingredients', [])]
        # 檢查是否有任何食材匹配
        if any(ing.lower() in ' '.join(recipe_ingredients) for ing in ingredients):
            results.append(recipe)
            if len(results) >= max_results:
                break
    return results


def _filter_by_constraints(recipes, constraints):
    """根據限制條件過濾食譜"""
    filtered = []
    for recipe in recipes:
        # 檢查烹飪時間
        if 'max_time' in constraints:
            cooking_time = recipe.get('cooking_time')
            if cooking_time and cooking_time > constraints['max_time']:
                continue
        
        # 檢查步驟數 - 從 steps 陣列計算
        if 'max_steps' in constraints:
            steps = recipe.get('steps', [])
            num_steps = len(steps)
            if num_steps > constraints['max_steps']:
                continue
        
        filtered.append(recipe)
    return filtered

@tool
def search_recipe_by_ingredient(ingredients: str, max_results: int = 10) -> str:
    """
    根據食材搜尋適合的食譜
    
    Args:
        ingredients: 可用食材列表，用逗號分隔 (例如: "雞腿,洋蔥,番茄")
        max_results: 最大結果數
    
    Returns:
        JSON格式的食譜搜尋結果
    """
    ingredient_list = [ing.strip() for ing in ingredients.split(',')]
    recipes = _search_by_ingredients(ingredient_list, max_results)
    
    result = {
        "total_found": len(recipes),
        "recipes": recipes
    }
    print(f"🔍 planner agent: search_recipe_by_ingredient, 搜尋食材: {ingredient_list}")
    return json.dumps(result, ensure_ascii=False, indent=2)


@tool
def search_recipes_by_tags(tags: str, max_results: int = 10) -> str:
    """
    根據標籤搜尋食譜
    
    Args:
        tags: 標籤列表，用逗號分隔 (例如: "家常菜,烤箱料理,石斑料理")
        max_results: 最大結果數
    
    Returns:
        JSON格式的食譜搜尋結果
    """
    data = _load_recipes_data()
    recipes = data['recipes']
    
    # 解析標籤
    tag_list = [tag.strip().replace('#', '') for tag in tags.split(',')]
    tag_list = [tag for tag in tag_list if tag]  # 移除空標籤
    
    print(f"🔍 planner agent: search_recipes_by_tags, 搜尋標籤: {tag_list}")
    
    filtered_recipes = []
    for recipe in recipes:
        recipe_tags = recipe.get('tags', [])
        
        # 檢查是否有任何標籤匹配
        matched = False
        for search_tag in tag_list:
            for recipe_tag in recipe_tags:
                clean_search = search_tag.lower()
                clean_recipe = recipe_tag.replace('#', '').lower()
                
                if (clean_search == clean_recipe or 
                    clean_search in clean_recipe or 
                    clean_recipe in clean_search):
                    matched = True
                    break
            if matched:
                break
        
        if matched:
            filtered_recipes.append(recipe)
            if len(filtered_recipes) >= max_results:
                break
    print(f"🔍 planner agent: search_recipes_by_tags, 搜尋結果: {filtered_recipes}")
    result = {
        "total_found": len(filtered_recipes),
        "search_tags": tag_list,
        "recipes": filtered_recipes
    }
    
    return json.dumps(result, ensure_ascii=False, indent=2)

@tool
def filter_recipes_by_constraints(recipes_json: str, constraints: str = "") -> str:
    """
    根據限制條件過濾食譜
    
    Args:
        recipes_json: JSON格式的食譜列表
        constraints: 限制條件，格式: "max_time:30,max_steps:5" 或 "max_time:30" 或 "max_steps:5" (可選)
    
    Returns:
        JSON格式的過濾後食譜列表
    """
    try:
        # 直接解析 JSON
        recipes_data = json.loads(recipes_json)
        
        # 處理不同的 JSON 格式
        if isinstance(recipes_data, list):
            recipes = recipes_data
        elif isinstance(recipes_data, dict):
            recipes = recipes_data.get('recipes', [])
        else:
            recipes = []
        
        # 解析限制條件
        constraints_dict = {}
        if constraints:
            for constraint in constraints.split(','):
                if ':' in constraint:
                    key, value = constraint.split(':', 1)
                    key = key.strip()
                    value = value.strip()
                    
                    if key == 'max_time':
                        constraints_dict['max_time'] = int(value)
                    elif key == 'max_steps':
                        constraints_dict['max_steps'] = int(value)
        
        # 過濾食譜
        filtered_recipes = _filter_by_constraints(recipes, constraints_dict)
        
        result = {
            "total_found": len(filtered_recipes),
            "recipes": filtered_recipes
        }
        
        return json.dumps(result, ensure_ascii=False, indent=2)
        
    except json.JSONDecodeError as e:
        return json.dumps({"error": f"JSON解析錯誤: {str(e)}"}, ensure_ascii=False)
    except ValueError as e:
        return json.dumps({"error": f"數值解析錯誤: {str(e)}"}, ensure_ascii=False)