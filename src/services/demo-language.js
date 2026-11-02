// Exact original seed values, used only to upgrade existing demo records once.
const projects = {
  "website": {
    "title": [
      "Новият ни уебсайт",
      "Our new website"
    ],
    "description": [
      "От първата скица до последния детайл. Създаваме по-добро дигитално присъствие.",
      "From the first sketch to the final detail. Building a better digital presence."
    ]
  },
  "launch": {
    "title": [
      "Есенна кампания",
      "Autumn campaign"
    ],
    "description": [
      "Идеи, съдържание и всичко необходимо за следващия ни старт.",
      "Ideas, content and everything we need for our next launch."
    ]
  },
  "course": {
    "title": [
      "Курсов проект",
      "Course project"
    ],
    "description": [
      "Малките стъпки към едно голямо постижение. Софтуерни технологии с AI.",
      "Small steps towards a big achievement. Software Technologies with AI."
    ]
  }
};
const tasks = {
  "task-0": {
    "title": [
      "Проучване на добри примери",
      "Research inspiring examples"
    ],
    "description": [
      "Събери 5 сайта, които ни вдъхновяват. Запиши какво работи добре в тях.",
      "Collect five inspiring websites and note what works well."
    ]
  },
  "task-1": {
    "title": [
      "Текстове за страницата „За нас“",
      "Write the About us page"
    ],
    "description": [
      "Кратко представяне на екипа и нашата история.",
      "A short introduction to our team and our story."
    ]
  },
  "task-2": {
    "title": [
      "Проверка на достъпността",
      "Accessibility review"
    ],
    "description": [
      "Клавиатурна навигация, контраст и описания на изображенията.",
      "Keyboard navigation, contrast and image descriptions."
    ]
  },
  "task-3": {
    "title": [
      "Дизайн на началната страница",
      "Homepage design"
    ],
    "description": [
      "Подготви оформление за голям и малък екран. Обърни внимание на основното действие.",
      "Create layouts for desktop and mobile. Make the main action clear."
    ]
  },
  "task-4": {
    "title": [
      "Компоненти и навигация",
      "Components and navigation"
    ],
    "description": [
      "Общ header, footer, бутони и карти за всички страници.",
      "Shared header, footer, buttons and cards for every page."
    ]
  },
  "task-5": {
    "title": [
      "Структура на съдържанието",
      "Content structure"
    ],
    "description": [
      "Подредени са всички основни раздели.",
      "All main sections are now organised."
    ]
  },
  "task-6": {
    "title": [
      "Цветове и типография",
      "Colours and typography"
    ],
    "description": [
      "Избрани са основен цвят, акценти и четим шрифт.",
      "Primary colour, accents and a readable typeface selected."
    ]
  },
  "task-7": {
    "title": [
      "План за социалните мрежи",
      "Social media plan"
    ],
    "description": [
      "Календар с идеи и дати за публикации.",
      "A calendar of ideas and publication dates."
    ]
  },
  "task-8": {
    "title": [
      "Визии за кампанията",
      "Campaign visuals"
    ],
    "description": [
      "Подготви три различни формата.",
      "Prepare three different formats."
    ]
  },
  "task-9": {
    "title": [
      "Основно послание",
      "Core message"
    ],
    "description": [
      "Ясно, кратко и запомнящо се.",
      "Clear, concise and memorable."
    ]
  },
  "task-10": {
    "title": [
      "Подготовка за защитата",
      "Prepare the project presentation"
    ],
    "description": [
      "Демонстрирай основните сценарии и обясни архитектурата.",
      "Demonstrate the main workflows and explain the architecture."
    ]
  },
  "task-11": {
    "title": [
      "Връзка със Supabase",
      "Connect Supabase"
    ],
    "description": [
      "База данни, потребители и права за достъп.",
      "Database, users and access permissions."
    ]
  },
  "task-12": {
    "title": [
      "Преглед на изискванията",
      "Review the requirements"
    ],
    "description": [
      "Поне 5 екрана, 4 таблици, Auth и Storage.",
      "At least five screens, four tables, Auth and Storage."
    ]
  }
};
const stages = { 'За изпълнение': 'To do', 'В процес': 'In progress', 'Завършени': 'Done' };
export function upgradeDemoLanguage(state) {
  if (state.uiLanguage === 'en') return false;
  const convert = (row, stock) => {
    for (const [field, [previous, translated]] of Object.entries(stock || {})) if (row[field] === previous) row[field] = translated;
  };
  for (const row of state.projects) convert(row, projects[row.id]);
  for (const row of state.tasks) if (['website','launch','course'].includes(row.project_id)) convert(row, tasks[row.id]);
  for (const row of state.stages) if (Object.hasOwn(stages, row.name)) row.name = stages[row.name];
  for (const row of state.profiles) if (row.id === 'demo-owner' && row.display_name === 'Свилен') row.display_name = 'Svilen';
  state.uiLanguage = 'en';
  return true;
}
