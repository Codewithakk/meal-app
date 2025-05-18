export const getMealSuggestion = (ingredients: string[]): string => {
    if (ingredients.includes('chicken') && ingredients.includes('cheese')) {
        return 'How about a cheesy garlic chicken dish?'
    }
    if (ingredients.includes('spinach') && ingredients.includes('garlic')) {
        return 'You can make a delicious garlic spinach stir-fry!'
    }
    return "Sorry, I couldn't find a meal suggestion for those ingredients."
}
