import re

with open('artifacts/instagram-clone/src/lib/app-theme.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update AppThemeId
content = re.sub(r'export type AppThemeId =.*?;\n', "export type AppThemeId =\n  | 'tangled'\n  | 'sakura-fall'\n  | 'sara-lavender'\n  | 'moonlight-saga'\n  | 'floura'\n  | 'mint'\n  | 'library'\n  | 'autumn-amber'\n  | 'petrichor';\n", content, flags=re.DOTALL)

# 2. Update THEME_BACKGROUNDS
content = re.sub(r'const THEME_BACKGROUNDS: Partial<Record<AppThemeId, string>> = \{.*?\};', "const THEME_BACKGROUNDS: Partial<Record<AppThemeId, string>> = {\n  'sara-lavender': '/themes/sara-lilies.jpg',\n  'floura': '/themes/saralikedtheme.png',\n  'mint': '/mint-home.png',\n  'library': '/themes/library-bg.png',\n  'autumn-amber': '/themes/autumn-amber-bg.png',\n  'petrichor': '/themes/petrichor-bg.png',\n  'tangled': '/themes/tangled1.png',\n};", content, flags=re.DOTALL)

# 3. Move Tangled to the top of APP_THEMES and remove mustaq, snowfall
themes_match = re.search(r'export const APP_THEMES.*?\];', content, flags=re.DOTALL)
if themes_match:
    themes_str = themes_match.group(0)
    # The regex needs to capture the whole object, including nested braces
    # A simpler way is to find the start of '{ id: "tangled"' and the end of its object.
    
    tangled_start = themes_str.find('id: "tangled"')
    if tangled_start != -1:
        t_obj_start = themes_str.rfind('{', 0, tangled_start)
        t_obj_end = themes_str.find('},', tangled_start) + 2
        tangled_str = themes_str[t_obj_start:t_obj_end]
        themes_str = themes_str.replace(tangled_str, '')
        
        mustaq_start = themes_str.find('id: "mustaq"')
        if mustaq_start != -1:
            m_obj_start = themes_str.rfind('{', 0, mustaq_start)
            m_obj_end = themes_str.find('},', mustaq_start) + 2
            themes_str = themes_str.replace(themes_str[m_obj_start:m_obj_end], '')
            
        snowfall_start = themes_str.find('id: "snowfall"')
        if snowfall_start != -1:
            s_obj_start = themes_str.rfind('{', 0, snowfall_start)
            s_obj_end = themes_str.find('},', snowfall_start) + 2
            themes_str = themes_str.replace(themes_str[s_obj_start:s_obj_end], '')

        themes_str = themes_str.replace('] = [\n', '] = [\n    ' + tangled_str.strip() + ',\n')
        content = content.replace(themes_match.group(0), themes_str)

# 4. Remove helper functions
content = re.sub(r'export function isMustaqTheme.*?\}\n', '', content, flags=re.DOTALL)
content = re.sub(r'export function isSnowfallTheme.*?\}\n', '', content, flags=re.DOTALL)

# 5. Clean getThemeBackgroundOpacity
content = content.replace('  if (id === "mustaq") return 1.0;\n', '')
content = content.replace('  if (id === "snowfall") return 1.0;\n', '')

# 6. Clean getPhotoScrimGradient
content = re.sub(r'  if \(themeId === "mustaq"\) \{.*?\}\n', '', content, flags=re.DOTALL)

with open('artifacts/instagram-clone/src/lib/app-theme.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
