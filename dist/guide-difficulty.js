export const difficultyLevels = [1, 2, 3, 4, 5]
export const difficultyStars = level => '★'.repeat(level) + '☆'.repeat(5 - level)

export function difficultyMarkup(level) {
  if (!difficultyLevels.includes(level)) return '<span>Difficulty unrated</span>'
  return '<span class="difficulty-rating" role="img" aria-label="Difficulty: ' + level + ' out of 5">' +
    '<span class="difficulty-stars" aria-hidden="true">' + difficultyStars(level) + '</span>' +
    level + '/5</span>'
}
