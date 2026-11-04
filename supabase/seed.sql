-- Category tree (SPEC §4). Airsoft is sensitive and requires a compliance attestation.
insert into public.categories (slug, name_zh, name_en, icon, sensitive, requires_compliance, sort) values
  ('airsoft',      '野戰生存遊戲',     'Airsoft & Wargame',          'target',     true,  true,  10),
  ('figures',      '模型擺設',         'Figures & Collectibles',     'robot',      false, false, 20),
  ('gunpla',       '高達模型',         'Gunpla',                     'gundam',     false, false, 30),
  ('lego',         'LEGO 樂高',        'LEGO',                       'brick',      false, false, 40),
  ('tcg',          '桌遊 / 遊戲卡',    'Board Games & TCG',          'cards',      false, false, 50),
  ('diecast',      '車仔模型',         'Diecast Cars',               'car',        false, false, 60),
  ('drones',       '遙控無人機',       'Drones & Aerial',            'drone',      false, false, 70),
  ('rc-cars',      '遙控車 / 載具',    'RC Cars & Vehicles',         'rc-car',     false, false, 80),
  ('rc-boats',     '遙控船',           'RC Boats',                   'boat',       false, false, 90),
  ('rc-planes',    '遙控飛機',         'RC Planes',                  'plane',      false, false, 100),
  ('rc-heli',      '遙控直昇機',       'RC Helicopters',             'helicopter', false, false, 110),
  ('mini4wd',      '迷你四驅車',       'Mini 4WD',                   'mini4wd',    false, false, 120),
  ('nerf',         'NERF',             'NERF',                       'blaster',    false, false, 130),
  ('darts',        '飛鏢',             'Darts',                      'darts',      false, false, 140),
  ('jerseys',      '珍藏球衣',         'Collectible Jerseys',        'jersey',     false, false, 150),
  ('sneakers',     '珍藏鞋類',         'Collectible Sneakers',       'sneaker',    false, false, 160),
  ('video-games',  '電玩遊戲',         'Video Games',                'gamepad',    false, false, 170),
  ('other',        '其他',             'Other',                      'box',        false, false, 999);

-- Airsoft subcategories (inherit sensitive/compliance from parent via enforce_listing_rules).
insert into public.categories (parent_id, slug, name_zh, name_en, sort)
select id, s.slug, s.name_zh, s.name_en, s.sort
from public.categories, (values
  ('airsoft-gbb-pistol', 'GBB 手槍',       'GBB Pistols',          10),
  ('airsoft-gbb-rifle',  'GBB 長槍',       'GBB Rifles',           20),
  ('airsoft-aeg',        '電動槍 AEG',     'AEG',                  30),
  ('airsoft-revolver',   '氣體 / CO2 左輪', 'Gas & CO2 Revolvers', 40),
  ('airsoft-sniper',     '狙擊槍',         'Sniper Rifles',        50),
  ('airsoft-optics',     '瞄準器材',       'Optics & Sights',      60),
  ('airsoft-gear',       '裝備 / 背心',    'Gear & Vests',         70),
  ('airsoft-parts',      '零件 / 改裝',    'Parts & Upgrades',     80),
  ('airsoft-mags',       '彈匣',           'Magazines',            90)
) as s(slug, name_zh, name_en, sort)
where categories.slug = 'airsoft';
