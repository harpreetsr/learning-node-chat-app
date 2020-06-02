io()

const socket = io()

socket.on('message', (message) => {
    console.log(message)
})

document.querySelector('#message-form').addEventListener('submit', (e) => {
    e.preventDefault()

    const userMessage = e.target.elements.message.value
    socket.emit('sendMessage', userMessage)
})