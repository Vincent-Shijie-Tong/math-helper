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

Worked math answers teach two related formulas or rules. The tutor explains when to use each one, works through the numbers and units, and connects the results. For example, multiplication finds a rectangle’s area and division checks it by recovering one of its sides. Homework help ends with a similar problem to try. Study guides highlight the formulas and put the detailed solutions on the backs of the flashcards.

**Show steps** was checked with the built-in 42 − 17 example and a worksheet photo of 64 + 28. The tutor explained how to trade a ten for ten ones, found 25, and checked it by adding 17 back. For the photo it explained why 12 ones become 1 ten and 2 ones, giving 92.

All activities keep tutoring focused on math. Unrelated requests get a short invitation to ask a math question. For mixed questions, the tutor addresses the math part. Worked answers and study guides include a labeled table and explain how its rows help solve or check the problem.

Choose **Explain a concept**, enter a math topic or a “why” question, then press **Explain this idea**. The tutor explains the idea at the selected grade level, works through a familiar example, and gives a question to try. The built-in example compares 1/8 and 1/4 of the same whole.

Concept lessons display their model above the explanation. The fraction example draws two equal-size pizzas, one cut into eighths and one into quarters, with one slice highlighted on each. Other topics can show a diagram connecting the stages of the worked example.

**Check my work** checks the final answer and any steps the student shares. Choose the activity, enter the problem and your answer (or attach a clear photo), then select **Check my answer**. In live checks, it accepted 2/4 for 1/4 + 1/4, corrected a worksheet showing 5 × 6 = 35, and recognized a correct algebra answer reached through an incorrect step. It also checked unfinished work and asked for the original problem when given only an answer.

Only **Check my work** gives feedback about a student's likely mistake. For example, if a student writes 3 × 4 = 7, the tutor can show that 3 + 4 gives 7 and explain how to count three groups of four. It points to the first wrong step when the student shares their work and asks to see the steps when the answer alone gives no clear clue.

Requests for help hurting someone or doing something dangerous get one sentence in every activity: “I can only help with homework.” Students who report danger or bullying still get guidance to find a trusted adult.

In **Check my work**, the tutor copies and recalculates each submitted step before judging the work. A correct final answer can still have a wrong step.

Students can ask “Which step should I change?” or use the multiplication example in **Check my work**. The tutor explains the calculation kindly, shows a specific change to try, and gives a way to check it. If the student sounds discouraged, the tutor acknowledges that feeling and focuses on the next math step.

When an answer or a shown step needs a correction, feedback opens with the step to change or a possible explanation for the answer. **Try this next time** gives one habit to use on similar problems, even if the tutor needs more work to identify the cause.

## Next

Rehearse the short demo. Start with the fraction quiz example, check an incorrect multiplication answer, then tick a study goal and reload. Ask your teacher to check the explanations before your competition video.

After each save point, push it to GitHub.

## Maybe Later

- The user can get help understanding difficult science concepts.
- The user can receive practice questions to prepare for tests.
- The user can request examples of how to solve specific problems.
- The user can ask the AI to summarize a topic from class.
- The user can report bullying by telling the AI, which encourages talking to an adult.
- The user can receive a reminder to avoid sharing personal information.
- The user can ask the AI to clarify instructions for a project or assignment.
- The user can get encouragement and positive feedback after answering questions.
- The user can request additional resources for further learning on a topic.
- The user can ask the AI to help with organizing study schedules.
