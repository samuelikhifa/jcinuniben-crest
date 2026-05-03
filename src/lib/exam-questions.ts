export type Question = {
  id: string;
  question: string;
  options: string[];
  answer: number; // index
};

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    question: "What does JCI stand for?",
    options: [
      "Junior Chamber International",
      "Joint Christian Initiative",
      "Justice Commission International",
      "Junior Cadet Institute",
    ],
    answer: 0,
  },
  {
    id: "q2",
    question: "JCI's global mission is to provide:",
    options: [
      "Profit to members",
      "Development opportunities that empower young people to create positive change",
      "University scholarships only",
      "Free housing",
    ],
    answer: 1,
  },
  {
    id: "q3",
    question: "Which of the following is one of JCI's Areas of Opportunity?",
    options: ["Banking", "Business", "Agriculture", "Sports"],
    answer: 1,
  },
  {
    id: "q4",
    question: "JCI was founded in what year?",
    options: ["1915", "1944", "1960", "1985"],
    answer: 1,
  },
  {
    id: "q5",
    question: "The age range for active JCI membership is:",
    options: ["12–25", "18–40", "21–50", "30–60"],
    answer: 1,
  },
  {
    id: "q6",
    question: "What is the JCI Creed's first line?",
    options: [
      "We believe in God",
      "That faith in God gives meaning and purpose to human life",
      "Service to humanity is the best work of life",
      "Earth's great treasure lies in human personality",
    ],
    answer: 1,
  },
  {
    id: "q7",
    question: "Which is NOT a JCI value?",
    options: ["Active citizenship", "Service", "Greed", "Fellowship"],
    answer: 2,
  },
  {
    id: "q8",
    question: "JCI UNIBEN operates within which institution?",
    options: [
      "University of Benin",
      "University of Lagos",
      "University of Ibadan",
      "Ahmadu Bello University",
    ],
    answer: 0,
  },
  {
    id: "q9",
    question: "The international headquarters of JCI is located in:",
    options: ["Geneva", "St. Louis (Chesterfield), USA", "London", "Tokyo"],
    answer: 1,
  },
  {
    id: "q10",
    question: "Which best describes a Local Organization Member (LOM)?",
    options: [
      "A bank branch",
      "A local JCI chapter operating in a community or campus",
      "A government office",
      "A church group",
    ],
    answer: 1,
  },
];

// Fisher-Yates
export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
