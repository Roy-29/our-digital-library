const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/dashboard/sort/SortClient.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes("import { CustomSelect }")) {
  content = content.replace("import { useState, useMemo, useEffect } from 'react';", "import { useState, useMemo, useEffect } from 'react';\nimport { CustomSelect } from '@/components/CustomSelect';");
}

const regex = /<select\s+className="filter-select(?:.*?)?"\s+value={([^}]+)}\s+onChange={\(e\) => ([^}]+)\(e\.target\.value\)}\s*>([\s\S]*?)<\/select>/g;

content = content.replace(regex, (match, valueVar, setter, optionsBlock) => {
  let optionsArray = [];
  
  const optionsRegex = /<option(?: key={[^}]+})? value=(?:"([^"]*)"|{([^}]+)})>([\s\S]*?)<\/option>/g;
  let optMatch;
  while ((optMatch = optionsRegex.exec(optionsBlock)) !== null) {
    const valString = optMatch[1];
    const valExpr = optMatch[2];
    const labelRaw = optMatch[3].trim();
    
    // Label can be raw text or contain expressions
    // Wait, let's just make it a string if it's raw text
    // Actually, `label` inside CustomSelect can be a ReactNode! CustomSelect expects label: string | ReactNode. Let's see CustomSelect interface.
    // If it expects string, we might need to be careful. But `{a.nameBn || a.name}` needs to evaluate.
    
    const valueStr = valString !== undefined ? `'${valString}'` : valExpr;
    let labelStr = `'${labelRaw}'`;
    if (labelRaw.includes('{') || labelRaw.includes('`')) {
       // if it's like `{c.icon ? \`${c.icon} \` : ''}{c.nameBn || c.name}`
       labelStr = `\`${labelRaw.replace(/{/g, '${')}\``.replace(/\$\{\$\{(.*?)\}\}/g, '${$1}'); // Very naive
       
       // Just evaluate it properly
       // Better: wrap in a fragment if complex? CustomSelect expects string usually for search, but wait, CustomSelect doesn't search! It just displays!
       if (labelRaw === "{c.icon ? `${c.icon} ` : ''}{c.nameBn || c.name}") {
         labelStr = "`${c.icon ? c.icon + ' ' : ''}${c.nameBn || c.name}`";
       } else if (labelRaw === "{g.icon ? `${g.icon} ` : ''}{g.nameBn || g.name}") {
         labelStr = "`${g.icon ? g.icon + ' ' : ''}${g.nameBn || g.name}`";
       } else if (labelRaw.startsWith('{') && labelRaw.endsWith('}')) {
         labelStr = labelRaw.slice(1, -1);
       }
    }
    
    optionsArray.push(`{ value: ${valueStr}, label: ${labelStr} }`);
  }

  const mapRegex = /{([^.]+)\.map\(\(([^)]+)\)\s*=>\s*\(?\s*<option(?: key={[^}]+})? value={([^}]+)}>([\s\S]*?)<\/option>\s*\)?\s*\)}/g;
  let mapMatch;
  while ((mapMatch = mapRegex.exec(optionsBlock)) !== null) {
    const arrayName = mapMatch[1];
    const argName = mapMatch[2];
    const mapVal = mapMatch[3];
    const mapLabelRaw = mapMatch[4].trim();
    
    let mapLabelStr = mapLabelRaw;
    if (mapLabelRaw === "{c.icon ? `${c.icon} ` : ''}{c.nameBn || c.name}") {
         mapLabelStr = "`${c.icon ? c.icon + ' ' : ''}${c.nameBn || c.name}`";
       } else if (mapLabelRaw === "{g.icon ? `${g.icon} ` : ''}{g.nameBn || g.name}") {
         mapLabelStr = "`${g.icon ? g.icon + ' ' : ''}${g.nameBn || g.name}`";
       } else if (mapLabelRaw.startsWith('{') && mapLabelRaw.endsWith('}')) {
         mapLabelStr = mapLabelRaw.slice(1, -1);
    }

    optionsArray.push(`...${arrayName}.map((${argName}) => ({ value: ${mapVal}, label: ${mapLabelStr} }))`);
  }

  return `<CustomSelect
                      value={${valueVar}}
                      onChange={(val) => ${setter}(val)}
                      options={[
                        ${optionsArray.join(',\n                        ')}
                      ]}
                    />`;
});

// Fix sortBy dropdown which has inline onChange logic
const sortByRegex = /<select\s+className="filter-select"\s+style={{ minWidth: '150px' }}\s+value={sortBy}\s+onChange={\(e\) => setSortBy\(e\.target\.value as any\)}\s*>([\s\S]*?)<\/select>/;

if (sortByRegex.test(content)) {
  content = content.replace(sortByRegex, `<CustomSelect
                      value={sortBy}
                      onChange={(val) => setSortBy(val as any)}
                      options={[
                        { value: 'createdAt', label: 'সংগ্রহে যোগের তারিখ' },
                        { value: 'title', label: 'বইয়ের নাম' },
                        { value: 'publicationYear', label: 'প্রকাশের বছর' },
                        { value: 'pages', label: 'পৃষ্ঠা সংখ্যা' },
                        { value: 'rating', label: 'রেটিং' },
                        { value: 'price', label: 'দাম' }
                      ]}
                    />`);
}

// Fix sortOrder dropdown
const sortOrderRegex = /<select\s+className="filter-select"\s+style={{ minWidth: '130px' }}\s+value={sortOrder}\s+onChange={\(e\) => setSortOrder\(e\.target\.value as 'asc' | 'desc'\)}\s*>([\s\S]*?)<\/select>/;

if (sortOrderRegex.test(content)) {
  content = content.replace(sortOrderRegex, `<CustomSelect
                      value={sortOrder}
                      onChange={(val) => setSortOrder(val as 'asc' | 'desc')}
                      options={[
                        { value: 'desc', label: '▼ নিম্নক্রম (Z-A)' },
                        { value: 'asc', label: '▲ ঊর্ধ্বক্রম (A-Z)' }
                      ]}
                    />`);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Replaced custom selects successfully');
