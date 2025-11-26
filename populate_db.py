import sqlite3
import os

DB_FILE = 'chemistry.db'

def create_schema(cursor):
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS substances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        formula TEXT NOT NULL,
        category TEXT,
        state TEXT,
        color TEXT,
        description TEXT,
        molar_mass REAL
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS reactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        equation TEXT,
        type TEXT,
        conditions TEXT,
        description TEXT
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS reaction_inputs (
        reaction_id INTEGER,
        substance_id INTEGER,
        coefficient INTEGER,
        FOREIGN KEY(reaction_id) REFERENCES reactions(id),
        FOREIGN KEY(substance_id) REFERENCES substances(id)
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS reaction_outputs (
        reaction_id INTEGER,
        substance_id INTEGER,
        coefficient INTEGER,
        FOREIGN KEY(reaction_id) REFERENCES reactions(id),
        FOREIGN KEY(substance_id) REFERENCES substances(id)
    )
    ''')

def populate_data(cursor):
    # Substances
    substances = [
        # Inorganic - Oxides
        ('水', 'H2O', '氧化物', 'liquid', '#3b82f6', '生命之源，万能溶剂', 18.015),
        ('二氧化碳', 'CO2', '氧化物', 'gas', 'transparent', '温室气体，植物光合作用原料', 44.01),
        ('生石灰', 'CaO', '氧化物', 'solid', '#e5e7eb', '白色块状固体，遇水放热', 56.077),
        ('氧化铁', 'Fe2O3', '氧化物', 'solid', '#7f1d1d', '红棕色粉末，铁锈的主要成分', 159.69),
        ('氧化镁', 'MgO', '氧化物', 'powder', '#ffffff', '白色粉末，耐火材料', 40.304),
        
        # Inorganic - Acids
        ('盐酸', 'HCl', '酸', 'liquid', 'transparent', '胃酸的主要成分，强酸', 36.46),
        ('硫酸', 'H2SO4', '酸', 'liquid', 'transparent', '工业之母，强腐蚀性', 98.079),
        ('醋酸', 'CH3COOH', '酸', 'liquid', 'transparent', '食醋的主要成分，弱酸', 60.052),
        
        # Inorganic - Bases
        ('氢氧化钠', 'NaOH', '碱', 'solid', '#ffffff', '烧碱、火碱，强腐蚀性', 39.997),
        ('氢氧化钙', 'Ca(OH)2', '碱', 'powder', '#f3f4f6', '熟石灰，微溶于水', 74.093),
        
        # Inorganic - Salts
        ('氯化钠', 'NaCl', '盐', 'solid', '#ffffff', '食盐的主要成分', 58.44),
        ('碳酸钙', 'CaCO3', '盐', 'solid', '#d1d5db', '石灰石、大理石的主要成分', 100.086),
        ('硫酸铜', 'CuSO4', '盐', 'solid', '#1d4ed8', '蓝色晶体，遇水变蓝', 159.609),
        
        # Elements
        ('铁', 'Fe', '金属', 'solid', '#52525b', '银白色金属，易生锈', 55.845),
        ('铜', 'Cu', '金属', 'solid', '#b45309', '紫红色金属，导电性好', 63.546),
        ('镁', 'Mg', '金属', 'solid', '#d4d4d8', '银白色金属，燃烧发出耀眼白光', 24.305),
        ('碳', 'C', '非金属', 'solid', '#1f2937', '木炭、石墨，黑色固体', 12.011),
        ('氧气', 'O2', '非金属', 'gas', 'transparent', '支持燃烧，供给呼吸', 31.999),
        ('氢气', 'H2', '非金属', 'gas', 'transparent', '最轻的气体，可燃', 2.016),
        
        # Organic
        ('甲烷', 'CH4', '有机物', 'gas', 'transparent', '天然气的主要成分', 16.04),
        ('乙醇', 'C2H5OH', '有机物', 'liquid', 'transparent', '酒精，易挥发', 46.07),
        ('葡萄糖', 'C6H12O6', '有机物', 'solid', '#ffffff', '生命活动的主要能源物质', 180.156),
    ]
    
    cursor.executemany('''
    INSERT INTO substances (name, formula, category, state, color, description, molar_mass)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', substances)
    
    # Helper to get ID by formula
    def get_id(formula):
        cursor.execute('SELECT id FROM substances WHERE formula = ?', (formula,))
        res = cursor.fetchone()
        return res[0] if res else None

    # Reactions
    # Conditions: '点燃', '混合', '加热', '高温', '摇晃'
    reactions_data = [
        # Synthesis
        ('2H2 + O2 -> 2H2O', '化合反应', '点燃', '氢气在氧气中燃烧生成水', 
         [('H2', 2), ('O2', 1)], [('H2O', 2)]),
        ('C + O2 -> CO2', '氧化反应', '点燃', '碳在氧气中充分燃烧生成二氧化碳', 
         [('C', 1), ('O2', 1)], [('CO2', 1)]),
        ('CaO + H2O -> Ca(OH)2', '化合反应', '混合', '生石灰与水反应生成熟石灰，放出大量热', 
         [('CaO', 1), ('H2O', 1)], [('Ca(OH)2', 1)]),
        ('2Mg + O2 -> 2MgO', '化合反应', '点燃', '镁条燃烧发出耀眼白光，生成白色粉末', 
         [('Mg', 2), ('O2', 1)], [('MgO', 2)]),
         
        # Decomposition
        ('CaCO3 -> CaO + CO2', '分解反应', '高温', '碳酸钙高温分解生成生石灰和二氧化碳', 
         [('CaCO3', 1)], [('CaO', 1), ('CO2', 1)]),
         
        # Neutralization
        ('HCl + NaOH -> NaCl + H2O', '复分解反应', '混合', '酸碱中和反应', 
         [('HCl', 1), ('NaOH', 1)], [('NaCl', 1), ('H2O', 1)]),
         
        # Single Replacement
        ('Fe + CuSO4 -> FeSO4 + Cu', '置换反应', '混合', '铁置换出硫酸铜中的铜', 
         [('Fe', 1), ('CuSO4', 1)], [('Cu', 1)]), 
         
        # Combustion (Organic)
        ('CH4 + 2O2 -> CO2 + 2H2O', '氧化反应', '点燃', '甲烷燃烧生成二氧化碳和水', 
         [('CH4', 1), ('O2', 2)], [('CO2', 1), ('H2O', 2)]),
    ]
    
    for eqn, rtype, cond, desc, inputs, outputs in reactions_data:
        cursor.execute('INSERT INTO reactions (equation, type, conditions, description) VALUES (?, ?, ?, ?)', 
                       (eqn, rtype, cond, desc))
        reaction_id = cursor.lastrowid
        
        for formula, coeff in inputs:
            sid = get_id(formula)
            if sid:
                cursor.execute('INSERT INTO reaction_inputs (reaction_id, substance_id, coefficient) VALUES (?, ?, ?)',
                               (reaction_id, sid, coeff))
                               
        for formula, coeff in outputs:
            sid = get_id(formula)
            if sid:
                cursor.execute('INSERT INTO reaction_outputs (reaction_id, substance_id, coefficient) VALUES (?, ?, ?)',
                               (reaction_id, sid, coeff))

def main():
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
        
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    create_schema(cursor)
    populate_data(cursor)
    
    conn.commit()
    conn.close()
    print(f"Database {DB_FILE} created successfully.")

if __name__ == '__main__':
    main()
