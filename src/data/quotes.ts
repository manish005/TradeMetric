export type Quote = { q: string; a?: string };
export type QuoteCategory = "discipline" | "consistency" | "patience";

export const QUOTES: Record<QuoteCategory, Quote[]> = {
  discipline: [
    { q: "Discipline is choosing between what you want now and what you want most.", a: "Abraham Lincoln" },
    { q: "Small disciplines repeated with consistency every day lead to great achievements accumulated slowly.", a: "John C. Maxwell" },
    { q: "Success is not final, failure is not fatal: it is the courage to continue that counts.", a: "Winston Churchill" },
    { q: "Do or do not. There is no try.", a: "Yoda" },
    { q: "Discipline is doing what needs to be done, even when you don't feel like doing it." },
    { q: "You will never always be motivated. You have to learn to be disciplined." },
    { q: "Motivation gets you going, but discipline keeps you growing.", a: "John C. Maxwell" },
    { q: "The secret of your future is hidden in your daily routine.", a: "Mike Murdock" },
    { q: "Act on the plan, not on the pulse." },
    { q: "The market is driven by greed and fear, but survived by discipline." },
    { q: "A disciplined trader counts his losses as tuition." },
    { q: "Risk a fraction, keep the fortress." },
    { q: "Discipline is having the courage to follow your system even when you doubt it." },
    { q: "Missed greed, redeemed sleep." },
    { q: "Every account is a marathon; every trade only one mile." },
    { q: "What you do today is what your tomorrow looks like." },
    { q: "No deposit, no return." },
    { q: "Pips admit no crowd." },
    { q: "Speed is dumber than script; script is king." },
    { q: "Indecision is the brother of discipline's enemy — emotion." },
    { q: "A river cuts through rock, not because of its power, but because of its persistence. Wait — the trader guards his early drawdowns to live and compound later.", a: "James N. Watkins" },
    { q: "Guard your risk first; profits will find their own way to you." },
    { q: "Sturdy foundations never boast; they compound." },
    { q: "The board of finance rewards morning rituals." },
    { q: "Practice isn't the thing you do once. It's the thing you do forever." },
    { q: "Sustained investment in routine today is the freedom of tomorrow." },
    { q: "Strike rules down to habit; habit is grace." },
    { q: "Amateurs sit and wait for inspiration. The rest of us just get up and go to work.", a: "Stephen King" },
    { q: "Sequence beats selection — run the system, then refine it." },
    { q: "If the plan does not change with the news, you did not have a plan." },
    { q: "He who has overcome his fears will truly be free.", a: "Aristotle" },
    { q: "The successful warrior is the average man, with laser-like focus.", a: "Bruce Lee" },
  ],
  consistency: [
    { q: "Consistency is what transforms average into excellence.", a: "Stephen Covey" },
    { q: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", a: "Aristotle" },
    { q: "The secret of your success is found in your daily routine.", a: "John C. Maxwell" },
    { q: "Small repeated efforts make all the difference." },
    { q: "Trades, like rain, arrive to the patient field." },
    { q: "Practice isn't the thing you do once. It's the thing you do forever." },
    { q: "It is during our darkest moments that we must focus to see the light.", a: "Aristotle" },
    { q: "Every storm passes; hold the position and wait for sunlight." },
    { q: "Compounding is the eighth wonder of the world. He who understands it, earns it.", a: "Albert Einstein" },
    { q: "Time in the market beats timing the market.", a: "Ken Fisher" },
    { q: "Give a trader a target and he will act; teach a trader a routine and he will succeed." },
    { q: "Do not pray for an easy life, pray for the strength to endure a difficult one.", a: "Bruce Lee" },
    { q: "The trader's edge is built in the eye-twisting monotony of practice." },
    { q: "Amateurs sit and wait for inspiration. The rest of us just get up and go to work.", a: "Stephen King" },
    { q: "The journey of a thousand miles begins with a single step.", a: "Lao Tzu" },
    { q: "Practice isn't what gets you there once; it is what keeps you there forever." },
    { q: "The chapter repeats, the stance stays." },
    { q: "Sequence beats selection — run the system, then refine it." },
    { q: "1% better every single day compounds into a different business by the end of the year." },
    { q: "Fall seven times, get up eight.", a: "Japanese proverb" },
    { q: "Edge quietly grows while the crowd is asleep." },
  ],
  patience: [
    { q: "Patience is the companion of wisdom.", a: "St. Augustine" },
    { q: "Patience is bitter, but its fruit is sweet.", a: "Jean-Jacques Rousseau" },
    { q: "Patience is not the ability to wait, but how you behave while you're waiting.", a: "Joyce Meyer" },
    { q: "The two most powerful warriors are patience and time.", a: "Leo Tolstoy" },
    { q: "Time in the market beats timing the market.", a: "Ken Fisher" },
    { q: "The stock market is a device for transferring money from the impatient to the patient.", a: "Warren Buffett" },
    { q: "Only when the tide goes out do you discover who's been swimming naked.", a: "Warren Buffett" },
    { q: "The slow and steady turtle wins the race, not the sprinting rabbit." },
    { q: "An investment in knowledge pays the best interest.", a: "Benjamin Franklin" },
    { q: "Money grows on the tree of patience.", a: "Japanese proverb" },
    { q: "The carp waits years in the mud and crosses the dragon gate within one leap." },
    { q: "Do not judge me by my success, judge me by how many times I rose after falling.", a: "Nelson Mandela" },
    { q: "Let patience raise the compound." },
    { q: "Markets reward those who listen longer than they speak." },
    { q: "One patient position often outperforms ten hasty ones." },
    { q: "I watch the chart longer and see more." },
    { q: "Nothing in nature blooms all year. Be patient with yourself.", a: "Lailah Gifty Akita" },
    { q: "After the storm comes the harvest; after the screen comes the equity." },
    { q: "The tree grows upward, its roots grow down, both taking time." },
    { q: "Have patience. All things are difficult before they become easy.", a: "Saadi" },
    { q: "Time reveals what anxiety destroys." },
    { q: "A mountain of pips is dug with a patient spade." },
    { q: "He who waits for the river to pass will cross without a boat." },
    { q: "Patience is the broker's friend; hurry is his dropout." },
  ],
};

const DAY_MS = 86400000;

export function getDailyQuotes(date: Date): { category: QuoteCategory; quote: Quote }[] {
  const dayIndex = Math.floor(date.getTime() / DAY_MS);
  const n = date.getTimezoneOffset() > 0 ? dayIndex - 1 : dayIndex;
  return (["discipline", "consistency", "patience"] as QuoteCategory[]).map(
    (cat, i) => {
      const list = QUOTES[cat];
      const pick = list[(n + i * 7) % list.length];
      return { category: cat, quote: pick };
    }
  );
}