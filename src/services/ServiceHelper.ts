export function dateToString(date: Date) {
    //getMonth zero based warum auch immer
    return `${date.getDate()}.${date.getMonth()+1}.${date.getFullYear()}`;
}