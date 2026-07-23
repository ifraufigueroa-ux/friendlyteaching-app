// FriendlyTeaching.cl — IELTS Academic Writing Task 1 prompts
// Reports on charts, graphs, tables, maps. 150+ words, ~20 min.

import type { AcademicTask1Prompt } from '@/types/ielts-writing';
import { barChart, lineChart, pieChart, tableChart, beforeAfterMap } from './svg';

const STANDARD_INSTRUCTION =
  'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.';

const parkBefore = `<rect x="0" y="0" width="300" height="240" fill="#F0E5FF" stroke="#5A3D7A" stroke-width="2"/>
<rect x="20" y="20" width="260" height="200" fill="#DCFCE7" stroke="#059669" stroke-dasharray="4 4"/>
<circle cx="150" cy="120" r="40" fill="#93C5FD" stroke="#0284C7" stroke-width="2"/>
<text x="150" y="124" text-anchor="middle" font-size="11" fill="#1E3A8A">pond</text>
<rect x="40" y="180" width="60" height="30" fill="#F59E0B" stroke="#B45309"/>
<text x="70" y="199" text-anchor="middle" font-size="10" fill="#7C2D12">café</text>
<text x="150" y="20" text-anchor="middle" font-size="10" fill="#5A3D7A">— main gate (N) —</text>
<text x="150" y="235" text-anchor="middle" font-size="10" fill="#5A3D7A">footpath</text>`;

const parkAfter = `<rect x="0" y="0" width="300" height="240" fill="#F0E5FF" stroke="#5A3D7A" stroke-width="2"/>
<rect x="20" y="20" width="260" height="200" fill="#DCFCE7" stroke="#059669" stroke-dasharray="4 4"/>
<circle cx="80" cy="80" r="25" fill="#93C5FD" stroke="#0284C7" stroke-width="2"/>
<text x="80" y="84" text-anchor="middle" font-size="9" fill="#1E3A8A">pond</text>
<rect x="180" y="60" width="80" height="60" fill="#F59E0B" stroke="#B45309"/>
<text x="220" y="94" text-anchor="middle" font-size="10" fill="#7C2D12">café + gift shop</text>
<rect x="40" y="150" width="220" height="30" fill="#A78BFA" stroke="#6D28D9"/>
<text x="150" y="170" text-anchor="middle" font-size="10" fill="#fff">children's playground</text>
<circle cx="220" cy="200" r="12" fill="#F87171"/>
<text x="220" y="204" text-anchor="middle" font-size="8" fill="#fff">WC</text>
<text x="150" y="20" text-anchor="middle" font-size="10" fill="#5A3D7A">— main gate (N) —</text>
<text x="150" y="235" text-anchor="middle" font-size="10" fill="#5A3D7A">paved cycle path</text>`;

export const ACADEMIC_T1_PROMPTS: AcademicTask1Prompt[] = [
  {
    id:      'ac-t1-01-energy-consumption',
    version: 'academic',
    task:    1,
    title:   'Household energy consumption',
    prompt:  `The bar chart below shows the average monthly household energy consumption (in kWh) in four countries in 2010 and 2020.\n\n${STANDARD_INSTRUCTION}`,
    visual: {
      kind:  'bar',
      title: 'Household energy consumption by country (kWh/month)',
      svg:   barChart({
        title:   'Average monthly household energy consumption',
        yLabel:  'kWh/month',
        xLabels: ['Germany', 'Japan', 'Brazil', 'India'],
        series: [
          { name: '2010', values: [340, 420, 180, 90] },
          { name: '2020', values: [280, 380, 260, 165] },
        ],
      }),
    },
    minWords:     150,
    suggestedMin: 20,
    tags: ['energy', 'environment', 'comparison'],
  },
  {
    id:      'ac-t1-02-internet-users',
    version: 'academic',
    task:    1,
    title:   'Internet users over time',
    prompt:  `The line graph below shows the percentage of the population using the internet in three regions between 2000 and 2020.\n\n${STANDARD_INSTRUCTION}`,
    visual: {
      kind:  'line',
      title: 'Internet users as % of population',
      svg:   lineChart({
        title:   'Percentage of population using the internet',
        yLabel:  '% of population',
        xLabels: ['2000', '2005', '2010', '2015', '2020'],
        series: [
          { name: 'North America', values: [42, 68, 76, 84, 90] },
          { name: 'Europe',        values: [28, 55, 68, 78, 86] },
          { name: 'Africa',        values: [1,  4,  10, 22, 42] },
        ],
        yMax: 100,
      }),
    },
    minWords:     150,
    suggestedMin: 20,
    tags: ['technology', 'trends'],
  },
  {
    id:      'ac-t1-03-transport-modes',
    version: 'academic',
    task:    1,
    title:   'Transport modes in a city',
    prompt:  `The pie chart below shows the modes of transport used by commuters to travel to work in a European city in 2022.\n\n${STANDARD_INSTRUCTION}`,
    visual: {
      kind:  'pie',
      title: 'Modes of transport to work — European city (2022)',
      svg:   pieChart({
        title: 'Commuters by transport mode (%)',
        slices: [
          { label: 'Car',          value: 42 },
          { label: 'Public bus',   value: 24 },
          { label: 'Metro/train',  value: 18 },
          { label: 'Bicycle',      value: 10 },
          { label: 'Walking',      value: 6  },
        ],
      }),
    },
    minWords:     150,
    suggestedMin: 20,
    tags: ['transport', 'urban'],
  },
  {
    id:      'ac-t1-04-education-spending',
    version: 'academic',
    task:    1,
    title:   'Public spending on education',
    prompt:  `The table below shows public spending on education as a percentage of GDP in five countries between 2005 and 2020.\n\n${STANDARD_INSTRUCTION}`,
    visual: {
      kind:  'table',
      title: 'Public spending on education (% of GDP)',
      svg:   tableChart({
        title:   'Public spending on education, % of GDP',
        headers: ['Country', '2005', '2010', '2015', '2020'],
        rows: [
          ['Norway',  '6.8', '7.1', '7.6', '7.9'],
          ['Chile',   '3.2', '3.9', '4.6', '5.1'],
          ['Japan',   '3.4', '3.5', '3.4', '3.3'],
          ['Mexico',  '4.7', '4.8', '4.3', '4.1'],
          ['Türkiye', '2.8', '3.1', '3.8', '4.3'],
        ],
      }),
    },
    minWords:     150,
    suggestedMin: 20,
    tags: ['education', 'economics'],
  },
  {
    id:      'ac-t1-05-park-redevelopment',
    version: 'academic',
    task:    1,
    title:   'Riverside Park redevelopment',
    prompt:  `The two maps below show Riverside Park before and after a redevelopment project completed in 2023.\n\n${STANDARD_INSTRUCTION}`,
    visual: {
      kind:  'map',
      title: 'Riverside Park — before and after redevelopment',
      svg:   beforeAfterMap({
        title:  'Riverside Park — before and after (2023)',
        before: { label: '1995 — original layout', svg: parkBefore },
        after:  { label: '2023 — after redevelopment', svg: parkAfter },
      }),
    },
    minWords:     150,
    suggestedMin: 20,
    tags: ['map', 'urban'],
  },
  {
    id:      'ac-t1-06-tourists-by-country',
    version: 'academic',
    task:    1,
    title:   'International tourist arrivals',
    prompt:  `The bar chart below shows the number of international tourist arrivals (in millions) in five countries in 2019 and 2023.\n\n${STANDARD_INSTRUCTION}`,
    visual: {
      kind:  'bar',
      title: 'International tourist arrivals (millions)',
      svg:   barChart({
        title:   'International tourist arrivals by country',
        yLabel:  'Arrivals (millions)',
        xLabels: ['France', 'Spain', 'USA', 'Türkiye', 'Argentina'],
        series: [
          { name: '2019', values: [90, 84, 79, 51, 7.4] },
          { name: '2023', values: [100, 85, 66, 55, 6.5] },
        ],
      }),
    },
    minWords:     150,
    suggestedMin: 20,
    tags: ['tourism', 'comparison'],
  },
  {
    id:      'ac-t1-07-recycling-rates',
    version: 'academic',
    task:    1,
    title:   'Household recycling rates',
    prompt:  `The line graph below shows household recycling rates (as % of waste) in four cities between 2000 and 2020.\n\n${STANDARD_INSTRUCTION}`,
    visual: {
      kind:  'line',
      title: 'Household recycling rate (%) — 2000-2020',
      svg:   lineChart({
        title:   'Household recycling rate (% of waste)',
        yLabel:  '% recycled',
        xLabels: ['2000', '2005', '2010', '2015', '2020'],
        series: [
          { name: 'Vienna',      values: [35, 48, 55, 62, 66] },
          { name: 'Copenhagen',  values: [28, 42, 55, 65, 72] },
          { name: 'Santiago',    values: [4,  6,  10, 18, 24] },
          { name: 'Buenos Aires',values: [3,  5,  8,  12, 15] },
        ],
        yMax: 80,
      }),
    },
    minWords:     150,
    suggestedMin: 20,
    tags: ['environment', 'trends'],
  },
  {
    id:      'ac-t1-08-population-by-age',
    version: 'academic',
    task:    1,
    title:   'Population by age group',
    prompt:  `The table below shows the projected distribution of the population by age group in Chile for 2020, 2035 and 2050.\n\n${STANDARD_INSTRUCTION}`,
    visual: {
      kind:  'table',
      title: 'Chile — projected population by age group (%)',
      svg:   tableChart({
        title:   'Chile — projected population share by age group (%)',
        headers: ['Age group', '2020', '2035', '2050'],
        rows: [
          ['0-14',   '19.3', '15.8', '13.2'],
          ['15-29',  '21.1', '18.9', '16.4'],
          ['30-59',  '41.5', '39.2', '37.6'],
          ['60+',    '18.1', '26.1', '32.8'],
        ],
      }),
    },
    minWords:     150,
    suggestedMin: 20,
    tags: ['demographics', 'projection'],
  },
];
