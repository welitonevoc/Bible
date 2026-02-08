
import { Lesson, LessonStatus } from '../types';

export const MOCK_LESSONS: Lesson[] = [
  {
    id: '1',
    title: 'A Promessa da Salvação',
    summary: 'Um estudo profundo sobre as promessas messiânicas no Antigo Testamento e seu cumprimento em Cristo.',
    commentator: 'Pr. Antônio Silva',
    year: 2024,
    quarter: 1,
    theme: 'Soteriologia',
    studyDate: '2024-01-07',
    status: LessonStatus.COMPLETED,
    content: 'A salvação é o tema central da Bíblia. Desde o Gênesis até o Apocalipse, vemos o plano redentor de Deus se desdobrando...'
  },
  {
    id: '2',
    title: 'O Caráter do Cristão',
    summary: 'Análise das bem-aventuranças e como elas definem a identidade do seguidor de Jesus.',
    commentator: 'Dr. Lucas Mendes',
    year: 2024,
    quarter: 1,
    theme: 'Vida Cristã',
    studyDate: '2024-01-14',
    status: LessonStatus.IN_PROGRESS,
    content: 'As bem-aventuranças não são apenas promessas futuras, mas realidades presentes para aqueles que vivem sob o Reino de Deus.'
  },
  {
    id: '3',
    title: 'Doutrina da Igreja',
    summary: 'A eclesiologia bíblica e os desafios da igreja contemporânea na pós-modernidade.',
    commentator: 'Profa. Maria Oliveira',
    year: 2024,
    quarter: 2,
    theme: 'Eclesiologia',
    studyDate: '2024-04-07',
    status: LessonStatus.TODO,
    content: 'A igreja não é um prédio, mas um corpo vivo. Neste estudo, exploramos as metáforas bíblicas para a comunidade de fé.'
  },
  {
    id: '4',
    title: 'Escatologia: Sinais do Fim',
    summary: 'Uma abordagem equilibrada sobre as profecias bíblicas e o retorno glorioso de nosso Senhor.',
    commentator: 'Ev. Roberto Rocha',
    year: 2023,
    quarter: 4,
    theme: 'Profecias',
    studyDate: '2023-12-24',
    status: LessonStatus.COMPLETED,
    content: 'O estudo da escatologia deve produzir esperança e santificação, não medo ou especulações infundadas.'
  }
];
