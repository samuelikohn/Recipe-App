interface Props {
    title: string,
    image: string,
    servings: number,
    prepTime: number,
    cookTime: number,
    equipment: string[],
    ingredients: string[],
    directions: []
};

export default function Recipe({title, image, servings, prepTime, cookTime, equipment, ingredients, directions}: Props) {

    return (
        null
    );

}