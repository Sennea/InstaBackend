// Metody pomocnicze do obslugi odpowiedzi
// Ten plik bedzie modyfikowany

const success = (res, status) => (entity) => {
    if (entity) {
        res.status(status || 200).json(entity)
    }
    return null
}

const notFound = (res) => (entity) => {
    if (entity) {
        return entity
    }
    res.status(404).end()
    return null
}

module.exports = {
    success, notFound
}
