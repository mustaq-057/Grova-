import os, re

files = [
    'artifacts/instagram-clone/src/pages/Home.tsx',
    'artifacts/instagram-clone/src/pages/Tasks.tsx',
    'artifacts/instagram-clone/src/lib/auth.tsx',
    'artifacts/instagram-clone/src/components/Layout.tsx',
    'artifacts/instagram-clone/src/components/ThemeDecor.tsx'
]

for file in files:
    if not os.path.exists(file):
        continue
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Home.tsx
    if 'Home.tsx' in file:
        content = re.sub(r', isSnowfallTheme', '', content)
        content = re.sub(r'import SnowfallOverlay from "@/components/SnowfallOverlay";\n', '', content)
        content = re.sub(r'const isSnowfall = isSnowfallTheme\(appTheme\);\n', '', content)
        content = re.sub(r'\{isSnowfall && <SnowfallOverlay />\}\n', '', content)

    # Tasks.tsx
    if 'Tasks.tsx' in file:
        content = re.sub(r'const mustaqLabel =[^;]+;\n', 'const mustaqLabel = "Hubby";\n', content)

    # Layout.tsx
    if 'Layout.tsx' in file:
        content = re.sub(r'import \{[^}]*isMustaqTheme,[^}]*\} from "@/lib/app-theme";', 'import { getStoredAppTheme, isTangledTheme } from "@/lib/app-theme";', content) # Simplification
        content = re.sub(r'import FallingMustaqOverlay from "\./FallingMustaqOverlay";\n', '', content)
        content = re.sub(r'import SnowfallOverlay from "\./SnowfallOverlay";\n', '', content)
        content = re.sub(r'const showMustaqNames = isMustaqTheme\(appTheme\);\n', '', content)
        content = re.sub(r'const showSnowfall = isSnowfallTheme\(appTheme\);\n', '', content)
        content = re.sub(r'\{showMustaqNames && <FallingMustaqOverlay />\}\n', '', content)
        content = re.sub(r'\{showSnowfall && <SnowfallOverlay />\}\n', '', content)

        # Let's fix the imports dynamically
        content = re.sub(r'isMustaqTheme,', '', content)
        content = re.sub(r'isSnowfallTheme,', '', content)

    # ThemeDecor.tsx
    if 'ThemeDecor.tsx' in file:
        content = re.sub(r'if \(theme === "mustaq"\) return \(.*?\}\);\n', '', content, flags=re.DOTALL)
        content = re.sub(r'if \(theme === "mustaq"\) return <div.*?</div>;\n', '', content)
        content = re.sub(r'<radialGradient id="mustaqGlow".*?</radialGradient>\n', '', content, flags=re.DOTALL)
        content = re.sub(r'<circle cx="100" cy="100" r="80" fill="url\(#mustaqGlow\)".*?/>\n', '', content)

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done cleaning components!")
