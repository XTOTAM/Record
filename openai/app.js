$(document).ready(function () {
    const questionForm = $("#question-form");
    const responseContainer = $("#response-container");
    const responseText = $("#response-text");

    questionForm.on("submit", function (event) {
        event.preventDefault();

        const question = $("#question").val();
        responseText.text("Loading...");

        askGPT(question)
            .then((answer) => {
                responseText.text(answer);
            })
            .catch((error) => {
                console.error(error);
                responseText.text("Error: Unable to get a response");
            });
    });

    async function askGPT(prompt) {
        // Replace with your own API key and endpoint.
        const apiKey = "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";
        const apiUrl = "https://api.openai.com/v1/engines/text-davinci-003/completions";


        const headers = new Headers();
        headers.append("Content-Type", "application/json");
        headers.append("Authorization", `Bearer ${apiKey}`);

        const requestOptions = {
            method: "POST",
            headers: headers,
            body: JSON.stringify({

prompt: prompt,
            max_tokens: 100,
            n: 1,
            stop: null,
            temperature: 0.7,
        }),
    };

    const response = await fetch(apiUrl, requestOptions);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.choices[0].text.strip();
}

});

