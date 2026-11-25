# Math Helper

## Run it

From the project folder, run `node --env-file=.env server/app.mjs` with Node.js 24. Open http://127.0.0.1:3000 on this computer. Restart after editing .env.

## Put it online with Vercel

1. In Vercel, choose **Add New → Project** and import the GitHub repository `Vincent-Shijie-Tong/math-helper`.
2. Use the repository root. The project supplies its settings in `vercel.json`. Vercel serves the page from `public/` and runs the tutor at `/api/ask` as a Node.js function.
3. Under **Environment Variables**, add `KEYGEN_URL` and `KEYGEN_TOKEN` with your MindDo values for **Production**. Select **Preview** too if you want AI answers in preview deployments. These are the only settings you need to fill in. Keep both values in Vercel and your local ignored `.env`.
4. Choose **Deploy**. Open the resulting site, choose **Use example question**, then **Get study tips**. After changing environment values in Vercel, redeploy for them to take effect.

Checklist marks stay in the browser for each site address. The online site starts with its own checklist.

## Version 1

Use **Your grade** on the left (above the activities on smaller screens) to choose levels 1–18. It changes the wording, examples and steps for the next question in every activity. Levels 13–18 represent years after high school. Leaving the picker blank gives elementary explanations. The grade is sent with the question and is not saved by the app.

Study tips come first. Homework help, worked steps and answer checks accept a typed question or a worksheet photo. Choose an activity, type a question or use its example, then press the green button.

Homework help works whenever the server is running and can reach the AI. To try it, choose **Homework help**, select **Use example question**, and press **Help me start**. In the local check, the tutor explained why three bags of four make 12 marbles and solved 37 + 26 from a worksheet photo by regrouping to get 63.

In Study tips, enter a test topic or its problems and choose **Get study tips**. Each guide gives three ways to study and six flashcards. The first two cards review ideas. The next four give new problems to solve at the selected grade level. Tap each card to see the answer and how to get it. Worked examples explain the rule, why the steps work, and how to check the answer.

The AI connects through getKey() on the server. MindDo model: `gpt-5.6-luna`.
Saves on this computer only for now. The browser saves the three sample checklist marks. Questions, photos and replies have no app chat history. The in-app privacy notice explains OpenAI retention.

Tutor explanations now use longer, grade-appropriate lessons. The tutor gives the formula in words, explains its parts and units, substitutes the numbers, and checks the result. Homework help ends with a similar problem to try. Study guides highlight the rule and put the detailed solutions on the backs of the flashcards.

## Next

Rehearse the short demo. Start with the fraction quiz example, check an incorrect multiplication answer, then tick a study goal and reload. Ask your teacher to check the explanations before your competition video.

After each save point, push it to GitHub.

## Maybe Later

- The user can get help understanding difficult science concepts.
- The user can ask the AI to explain mistakes without blame.
- The user can receive practice questions to prepare for tests.
- The user can request examples of how to solve specific problems.
- The user can ask the AI to summarize a topic from class.
- The user can report bullying by telling the AI, which encourages talking to an adult.
- The user can receive a reminder to avoid sharing personal information.
- The user can ask the AI to clarify instructions for a project or assignment.
- The user can get encouragement and positive feedback after answering questions.
- The user can request additional resources for further learning on a topic.
- The user can ask the AI to help with organizing study schedules.
