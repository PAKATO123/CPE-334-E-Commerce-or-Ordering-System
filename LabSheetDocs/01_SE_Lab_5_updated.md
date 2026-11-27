

CPE 334  Introduction to Software Engineering in the Age of AI Agents Sections 1, 2, HS, 31 and 32. Semester: 1/2026. Lab 5. Cloud Deployment and CI/CD Pipeline on GCP.              Score: ____ / 100 

Instructors: Assoc. Prof. Suthep Madarasmi, Ph.D. (Jogie) (suthep.mad@kmutt.ac.th) Aj. Piyanit Ua-areemitr, Ph.D (Toey) (piyanit.wep@kmutt.ac.th) Aj. Santawat Thanyadit Ph.D. (Job) (santawat.than@kmutt.ac.th) TAs: Rachawipa Katippatee (Bom) (rachawipa.kati@gmail.com) Kantapat Suwannahong (Bump) (kantapat.suwan@kmutt.ac.th) Rattanachote Petpansri (Loogmoo) (rattanachote.petpa@kmutt.ac.th) Prapatsorn Sangrod (Noon) (prapatsorn.sangr@kmutt.ac.th) Supachok Deetaweesukh (Tik) (jedsadaporn.pann@mail.kmutt.ac.th) 

### Lab 5 briefly 

|Item|Details|
|---|---|
|Type|Group lab.Same team of two, same repository, and same application as<br>your Group Project.|
|Starting point|Your accepted Sprint 1 release (Project Deliverable 1, due Sunday 8<br>November 2026).|
|Lab sessions|3 and 5 November 2026, with the TA walkthrough in Lecture 11 (Section<br>6).|
|Due|Sunday 15 November 2026, 23:59|
|Points|100 lab points(5% of the course grade).|
|Rubric|CI and quality gate 30 | Docker and reproducible configuration 20 | GCP<br>deployment and persistence 35 | Repeatable release pipeline 15.|
|Required vs.<br>recommended|Requireditems come from the CPE 334 Group Work Specification<br>(Section 4) and are graded.Recommendeditems (Section 5) are what the<br>Starter Kit and Student Guide already do; they are not scored separately.|
|Materials|Student Guide: GCP Deployment and CI/CD (V1.1)shows how to do each<br>step, with videos on LEB2.Lab 5 Starter Kithas template files to adapt<br>(Section 6).|
|GCP access|GCP Free Trial (USD 300 credit) on one member’s personal Gmail<br>account, as in Student Guide Episode 1 (Section 4.4).|
|Public repository|Required (R-12).Never commit .env, passwords, connection strings, or<br>keys (Section 4.3).|
|Submit|One PDF per team on LEB2, namedlab5_sec<section>_<group<br>name>.pdf(Section 12).|
|Questions|Ask in the course Facebook group.|



-1- 

## 1. Software Delivery Increment in Lab 5 

In Labs 1 to 4, TokTickIT ran only on your own computer. Lab 5 is a group lab: your team of two takes its accepted Group Project Sprint 1 release from a laptop to Google Cloud Platform (GCP) and adds a pipeline that checks every change and deploys the accepted ones. You keep the same application, GCP project, and pipeline for Lab 6, Lab 7, and the Final Project. By the end of Lab 5: 

- the application is packaged with Docker and builds and runs from a clean clone; 

- it runs on GCP at a public URL, with the UI, API, and database working together; 

- its data survives an application restart and a redeploy; 

- every relevant Pull Request runs the build and the automated tests, and a failed required check blocks the merge; and 

- accepted releases deploy from main through a repeatable pipeline, and you can show which commit is running. 

Both members take part in all of Lab 5: you may split tasks, but not into permanent roles, and either member must be able to explain any sampled release step (R-11). The default is a shared team score; suspected non-participation is referred to the instructor. 



<!-- Start of picture text -->
1. Every Pull Request (ci-docker.yml) | ‘2. Merge into main (deploy.yml) \ ‘3. Rollback (Run workflow) \ { Runtime on Google Cloud<br>Featureopens abranch PR (deployRun skippedCl again7 if red) earlierimage_tag full Commit==  SHA DATABASESecret Manager URL<br>Migrate+; build ++ dockerseed + buildtests merge tagBuildis= full+ pushcommit7imageSHA ‘Skipdeployee prepCi,  existingbuild, migration; imagedip Cloud(scalesoud RuneRuntoservicezero)5<br>'1if [_ 4"esiancdloceerRequired check i Read image,  digest —<———(dataCloud4 sessionsSQL PostareSQLpersist)<br>Merge blocked Migration job<br>if the check fails (migrate + seed)<br>Update Cloud Run<br>(traffic to new revision)<br>‘Smoke test<br>health, ready, /, categories<br><!-- End of picture text -->

Figure 1. Lab 5 delivery path using the reference stack. The stack and the rollback path (3) are recommended, not required (Section 5); the requirements are in Section 4. 

## 2. Lab 5 Learning Outcomes 

- package a full-stack application into a container image that builds from a clean clone and reads its configuration from the environment; 

- deploy the container to GCP with a persistent database, and show that data survives a restart and a redeploy; 

- protect main so that only reviewed changes with passing build and test checks can be merged; 

- release accepted changes from main through a repeatable pipeline and identify which commit is running; and 

- use AI coding agents to build the pipeline while checking that every command, permission, and secret is safe. 

-2- 

## 3. Lab 5 Request from Stakeholder 

“Your Sprint 1 release works on your laptops, but nobody else can use it yet. Put it on Google Cloud so that we can open it in a browser at a real URL. Anything we enter must still be there after a restart and after your next release. 

From now on, a change may reach the live system only after it has been reviewed and has passed its tests, and every release must come from main through the same repeatable process. In Lab 6 a partner team will run user acceptance tests on your deployed system and report defects, and you will ship the fixes through this same pipeline. 

Keep costs low, and do not leave paid resources running when nobody needs them.” 

## 4. Required Work 

Every requirement below comes from the CPE 334 Group Work Specification (“Spec”). The rubric in Section 12 grades these items only. 

### 4.1. Requirements 

|ID|Requirement|Spec Section|
|---|---|---|
|R-01|Package the application with Docker. A fresh build from a clean<br>clone produces a working container.|5.1, 5.3, 10|
||Read every setting from the environment. Document each||
|R-02|environment variable in .env.example or deployment.md, and<br>commit no real secret.|5.3, 10|
|R-03|Deploy on GCP at a public URL. The domain workflow works there<br>through the UI, the API, and the database.|5.3, 10|
||Store data in a persistent database. Data survives an application||
|R-04|restart and a redeploy, so nothing the app needs is kept only in the<br>container.|5.1, 10|
|R-05|Run the build and the automated tests on every relevant Pull<br>Request, with meaningful test results.|5.3, 10|
||Make the passing check required, so a failed check cannot enter the||
|R-06|release path. Show it with a failing Pull Request from a temporary<br>branch, and never break the released application.|5.3, 10|
|R-07|Deploy accepted releases from main through a repeatable pipeline:<br>reviewed change, CI, merge, deployment. A documented manual<br>approval inside the pipeline is allowed. A separate cloud staging<br>environment is not required.|5.3, 8.3, 10|
|R-08|Identify the commit of each release (tag or commit SHA), and<br>document the release procedure so it can be repeated.|8.3, 10|



-3- 

|ID|Requirement|Spec Section|
|---|---|---|
||Use Issues and a project board, feature/fix branches, Pull Requests<br>into staging reviewed by your teammate, and a release Pull Request||
|R-09|from staging into main. Authors do not approve their own Pull<br>Requests, and every review states a specific check, question, finding,<br>or reason for approval.|5.3, 8.3|
||Label Lab 5 Issues and Pull Requests (for example lab5) so the<br>evidence is clearly separate from unrelated feature work. Keep the||
|R-10|history: do not delete or rewrite commits, contract revisions, or CI<br>runs. CI stays mandatory after Lab 5, and Lab 7 uses its run<br>history.|8.3|
||Both members take part in requirements, testing, AI-agent<br>supervision, implementation, review, and deployment. Record||
|R-11|contributions through Issues, commits, and Pull Request authorship<br>and review; for pair work, name both members in the Issue or Pull<br>Request. Equal commit counts are not required.|2|
||Make the repository public and keep it public until grading ends, so<br>the TAs and your Lab 6 partner team can open the code, Issues, Pull||
|R-12|Requests, and workflow runs. TAs are not added as collaborators to<br>private repositories. A public repository also lets the R-06 ruleset<br>work on GitHub Free.|11|



### 4.2. Not Required in Lab 5 

A separate cloud staging environment, Kubernetes or infrastructure-as-code tools, custom domains, load balancers, multi-region deployment, canary or blue/green releases, monitoring dashboards, load testing, real payment or messaging services, and features outside your approved Sprint 1 scope. 

### 4.3. Required Files 

|File|Content|
|---|---|
|Dockerfile, .dockerignore|Builds the application image. Add docker-compose.yml if you run<br>the app locally with a database.|
|.env.example|Every environment variable the app reads, with placeholder<br>values only.|
|CI and deploy workflows|For example .github/workflows/ci-docker.yml and deploy.yml, or<br>your equivalent.|
|docs/labs/lab-<br>05/deployment.md|Your stack and any change from the reference; each environment<br>variable (purpose, secret or not, where its value comes from); the<br>commands to build, test, run, migrate, and seed; GCP project,<br>region, and resource names; and the release procedure, including<br>how to find the commit that is running.|



-4- 

#### Your repository is public. Never commit a secret. 

Anyone can read and copy what you push, and bots scan public GitHub repositories for keys within minutes. Never commit or push: 

- a .env file with real values (keep .env in .gitignore and commit only .env.example); 

- passwords, connection strings such as DATABASE_URL, API keys, or service account key files; or 

- screenshots or logs that show any of them. 

Check git status and the diff before every commit. If a secret is pushed, deleting the file is not enough, because it stays in the Git history. Change the secret at once (for example the database password and its Secret Manager version), redeploy, and tell a TA. 

### 4.4. GCP Access 

- The Spec leaves the GCP access method to this handout (Spec 5.3). Follow Student Guide Episode 1: ● one member signs up for the GCP Free Trial (USD 300 credit) with a personal Gmail account that has never used it, not a @mail.kmutt.ac.th account (1.1); 

   - that member creates one project for Lab 5, Lab 6, Lab 7, and the Final Project, for example cpe334-sec1-team07 (1.2), and adds the teammate in IAM with the Editor role (1.3); and 

   - nobody pays a prepayment or clicks Upgrade. If GCP asks for payment or says the billing account is closed, take a screenshot and tell a TA. 

## 5. Recommended Practices 

The items below are not in the Spec, so they are not scored separately. The Starter Kit and the Student Guide already follow them, and they are the shortest safe path to R-01 to R-12. If your team chooses differently, write the choice and the reason in deployment.md. 

|Recommended practice|Student Guide / kit|
|---|---|
|Cost control (strongly recommended):Cloud SQL is billed for every hour it<br>exists. Create an alerts-only budget before any resource, set Cloud Run<br>minimum instances to 0 and maximum to 3 or fewer, use the smallest<br>Cloud SQL tier with storage auto-increase off, pause when idle, and tear<br>down after the course.|Episodes 1, 5.4, 9, 10|
|Secret scanning push protection:turn it on in the public repository so<br>GitHub blocks a push that contains a key or password. If a secret is ever<br>pushed, change it at once.|R-02, R-12|
|Reference stack: Artifact Registry, Cloud Run, Cloud SQL for PostgreSQL,<br>Secret Manager, and GitHub Actions.|Episode 0.2–0.4|
|Keep sessions and uploaded files in the database, not in the container (this<br>helps R-04).|Episode 2|
|Seed demo accounts for each role so the Lab 6 partner team can test. Keep<br>their passwords out of the code and never show them on screen; share them<br>with the partner team privately.|Episode 2|
|Keep runtime secrets in Secret Manager and pipeline secrets in GitHub<br>Actions secrets.|Episodes 5, 6|



-5- 

|Recommended practice|Student Guide / kit|
|---|---|
|Sign in from GitHub with Workload Identity Federation instead of a JSON<br>key; give service accounts and workflows only the permissions they need.|Episode 6|
|Tag each image with the full commit SHA and deploy it by digest (the<br>simplest way to meet R-08).|Episode 7|
|Run migrations in a separate job before the service is updated, and keep<br>them additive.|Episodes 5, 7|
|Run an automated, read-only smoke test against the live URL after every<br>deploy.|Episode 7|
|Roll back by redeploying an earlier image tag, then roll forward.|Episode 8|
|Pin GitHub Actions to a full commit SHA and let Dependabot propose<br>updates.|Kit README|



## 6. Supporting Materials and Lecture Walkthrough 

|Material|Use it for|
|---|---|
|Student Guide: GCP<br>Deployment and CI/CD<br>(V1.1)|Step-by-step Episodes 0 to 10. Each lists its commands, a Done<br>check, and an “If something fails” table.<br>Videos: LEB2 > Learn It > Student Guide: GCP Deployment and<br>CI/CD (Video).|
|Lab 5 Starter Kit<br>(toktickit-lab5-starter)|The TokTickIT deployment as a worked example, without the<br>application code. Its README lists each file and what to change for<br>another stack. Treat every file as a template to adapt.|



In Lecture 11 the TAs demonstrate the full path on TokTickIT in both the Thai and the English sections: signing in to GCP, deploying from a local machine, connecting a persistent database, deploying an approved change through CI/CD, and showing a failing check that blocks a merge. If the guide or the kit disagrees with this handout, follow this handout and tell a TA. 

## 7. Lab 5 Execution Steps 

Work through the Student Guide in order. Each step has its own GitHub Issue (the guide numbers them #1 to #8). 

|#|What to do|Guide|Done when|
|---|---|---|---|
|1|Start the GCP Free Trial, create<br>the project, and add your teammate<br>(Section 4.4). Recommended: create<br>the budget alert first.|Ep. 1|Billing → Credits shows the credit and<br>both members can open the project.|
|2|Make the app cloud-ready and<br>write the first deployment.md.|Ep. 2|Settings come from the environment and<br>nothing the app needs is kept only in the<br>container (R-02, R-04).|
|3|Containerize the app.|Ep. 3|A fresh build runs with its database (R-<br>01).|



-6- 

|#|What to do|Guide|Done when|
|---|---|---|---|
|4|Add CI on Pull Requests.|Ep. 4|A Pull Request shows the build and test<br>checks (R-05).|
|5|Deploy to GCP for the first time.|Ep. 5|The public URL opens and you can sign<br>in (R-03).|
|6|Connect GitHub to GCP and set the<br>merge gate.|Ep. 6|A failing Pull Request from a temporary<br>branch cannot be merged (R-06).|
||Add the deploy workflow; release a||The URL shows the change and you can|
|7|visible change through staging into<br>main.|Ep. 7|show which commit is running (R-07, R-<br>08).|
|8|Check persistence. Recommended:<br>roll back and roll forward.|Ep. 8|Data created earlier survives a restart<br>and a redeploy (R-04).|
|9|Finish deployment.md and the<br>PDF.|Sec. 4.3,<br>12|Every rubric part has a row in the<br>evidence index.|



## 8. Required Checks 

Record each check with the file or test name, the command or CI run, the result, and the tested commit (Spec 11). 

|Check|What it shows|Covers|Evidence|
|---|---|---|---|
|C-01|A normal Pull Request runs the build<br>and all automated tests, and they pass.|R-05|CI run link and test summary|
|C-02|A Pull Request from a temporary<br>branch with one failing test cannot be<br>merged.|R-06|PR link; failed check and blocked<br>merge|
|C-03|A fresh clone builds and runs with only<br>.env.example values filled in.|R-01, R-02|Commands and output|
|C-04|The domain workflow works on the<br>public URL: sign in, the main business<br>action, and one rule rejection or access<br>restriction.|R-03|Screenshots with the URL<br>visible|
|C-05|A record created before a restart and a<br>redeploy is still there afterwards.|R-04|Before and after screenshots|
|C-06|A reviewed change goes from staging<br>into main and is deployed, and the<br>running revision matches its commit.|R-07<br>to R-10|PR links, pipeline run, GCP<br>revision|



-7- 

## 9. Team Workflow and AI Agents 

Similar to Labs 2 to 4. Each Issue has its own feature branch and enters staging through a Pull Request reviewed by your teammate. staging enters main through a release Pull Request. Only main deploys, so every merge into main is a release. Cloud setup done in the Console still gets an Issue; close it with a screenshot. When you use AI agents: 

- read every gcloud command or console change an agent proposes before it runs, and never let an agent change billing, IAM, or databases on its own; 

- never paste a secret, password, connection string, or key file into an agent chat; and 

- when a deploy fails, give the agent the log excerpt and ask for the cause before you ask for a fix. 

## 10. Common Problems 

Each Student Guide episode ends with an “If something fails” table, and kit docs/gcp-cicd-guide.md Section 8 adds more. Read the log of the failed step before changing anything. Not covered there: 

|Symptom|Likely cause and fix|
|---|---|
|Enabling an API fails with||
|FAILED_PRECONDITION or|Billing is not open. Check billingEnabled=true and the|
|UREQ_PROJECT_BILLING_NOT_OPE<br>N.|billing account, then tell a TA.|
|gcloud sql instances create rejects db-f1-<br>micro for PostgreSQL 16.|Add --edition=enterprise.|
|A step fails right after an account or role<br>was created.|IAM changes take a short time to spread. Wait a<br>minute and retry.|
|A secret leaked, and a new Secret|Change the password where it is used (for example the|
|Manager version changed nothing.|database user) as well, then redeploy.|



## 11. Definition of Done for Lab 5 

Tick every box before you submit. 

- ☐ a fresh clone builds and runs; every setting comes from the environment, and no secret is in the repository, the image, the logs, or the PDF; 

- ☐ the public URL serves the latest release from main, the domain workflow works there, and you can show which commit is running; 

- ☐ data survived a restart and a redeploy; 

- ☐ CI runs on every Pull Request into staging and main, and a failed required check blocks the merge; 

- ☐ the latest release reached main through reviewed Pull Requests and was deployed by the pipeline; 

- ☐ the repository is public (R-12); 

- ☐ deployment.md and the evidence index are complete, and either member can explain any sampled step; and 

- ☐ the PDF is named lab5_sec<section>_<group name>.pdf. 

-8- 

## 12. Submit One PDF File 

Each team submits one concise PDF on LEB2, named lab5_sec<section>_<group name>.pdf (for example lab5_sec1_bytebusters.pdf), by Sunday 15 November 2026, 23:59 . The PDF is an evidence index: link to the repository, Pull Requests, workflow runs, and the live service instead of repeating them. Use the headings “Answer Part 0” to “Answer Part 4” in order. Keep the service running until the instructor announces the end of grading. 

Links, explanations, and screenshots. For each item, give a direct link and one or two sentences that explain what it shows. Add a screenshot only when it is needed: 

- use a screenshot only for what a link cannot show on its own, such as a blocked merge button, a GCP Console setting, or the app before and after a redeploy; leave out screenshots that repeat a link; 

- give every screenshot a numbered caption that says what it shows, which check or requirement it proves, and the commit, run, or URL it comes from, for example: “Figure 3. C-02 (R-06): PR #14 from a temporary branch; the required check test-and-docker failed and merging is blocked. Commit a1b2c3d.” 

- crop to the part that matters and keep the text readable at 100% zoom; do not shrink a fullscreen capture to fit, and use the full page width for screenshots with small text. A box or arrow on the key part helps; and 

- place each screenshot under its Answer Part next to its link, and hide or blur any secret value before you insert it. 

How marks are given (Spec 11): TAs sample requirements, tests, Issues, Pull Requests, and deployed journeys. Marks reward observable behavior, traceability, meaningful tests, and credible execution evidence. Document length, prompt count, commit count, and visual polish alone do not earn marks, so keep the PDF short. 

|Part|Points|Required Submission Evidence|
|---|---|---|
|||Team number and topic; both students’ names, student IDs, and|
|0. Team and Evidence<br>Index (required, not<br>scored separately)|–|GitHub usernames; public repository link, submitted tag or<br>commit, public URL, and the commit it is serving; a short<br>contribution table with Issue and PR links; the evidence index<br>(example below).|
|1. CI and Quality<br>Gate|30|The CI workflow file; a passing Pull Request with meaningful<br>build and test results (C-01); the required-check setting for<br>main; the failing Pull Request from a temporary branch with<br>the blocked merge (C-02).|
|2. Docker and<br>Reproducible<br>Configuration|20|Dockerfile and .dockerignore; a fresh build and the running<br>container with its database (C-03); .env.example and the<br>environment variable table in deployment.md showing that no<br>secret is committed.|
|3. GCP Deployment<br>and Persistence|35|Public URL; the domain workflow on the live URL (C-04); UI,<br>API, and database connectivity; the GCP service and database;<br>data before and after a restart and a redeploy (C-05).|



-9- 

|Part|Points|Required Submission Evidence|
|---|---|---|
|||One labelled change from Issue to Pull Request into staging|
|4. Repeatable Release<br>Pipeline|15|with a specific teammate review, release Pull Request into<br>main, CI, and deployment; the pipeline run and the running<br>revision showing the release commit (C-06); the release<br>procedure in deployment.md.|
|Total|100||



Evidence index. At least one row per rubric part (Spec 11): 

|Rubric part|Artifact / direct link|IDs / version|Verification result|
|---|---|---|---|
|1. CI and quality<br>gate|PR #14 and its Actions run<br>link|C-02, commit a1b2c3d|Check failed; merge<br>blocked|
|3. GCP deployment|Public URL; persistence<br>screenshots|C-05, release e4f5a6b|Record present after<br>restart and redeploy|



#### Format the PDF like this: 

Answer Part 0: Team and Evidence Index [Links, short explanations, and captioned screenshots] Answer Part 1: CI and Quality Gate [Links, short explanations, and captioned screenshots] Answer Part 2: Docker and Reproducible Configuration [Links, short explanations, and captioned screenshots] Answer Part 3: GCP Deployment and Persistence [Links, short explanations, and captioned screenshots] Answer Part 4: Repeatable Release Pipeline [Links, short explanations, and captioned screenshots] 

-10- 

# **สรุปภาษาไทย (Thai Summary)** 

ส่วนนี้สรุปสาระส าคัญของ handout เป็นภาษาไทย หากข้อความไม่ตรงกัน ให้ยึดฉบับภาษาอังกฤษด้านบน 

|**หัวข้อ**|**รายละเอียด**|
|---|---|
|**ประเภทงาน**|งานกลุ่ม 2 คน ใช้ทีม, repo และแอปเดียวกับ Group Project โดยเริ่มจาก Sprint 1 release<br>ที่ผ่านการยอมรับแล้ว|
|**ก าหนดส่ง**|**วันอาทิตย์ที่ 15 พฤศจิกายน 2569 เวลา 23:59 น.**|
|**คะแนน**|100 คะแนน (5% ของเกรด)|
|**วิธีส่ง**|ส่ง PDF 1 ไฟล์ต่อกลุ่มทาง LEB2 ชื่อไฟล์ **lab5_sec<1/31>_<ชื่อกลุ่ม>.pdf**|
|**การเข้าใช้ GCP**|สมาชิก 1 คนสมัคร GCP Free Trial (เครดิต USD 300) ด้วย Gmail ส่วนตัว ห้ามใช้บัญชี<br>@mail.kmutt.ac.th ห้ามจ่าย prepayment และห้ามกด Upgrade (Student Guide Episode 1)|
|**เอกสารประกอบ**|- Student Guide: GCP Deployment and CI/CD (V1.1)<br>- Lab 5 Starter Kit เป็นไฟล์ตัวอย่างให้น าไปปรับใช้|
|**ติดต่อ / ถามปัญหา**|กลุ่ม Facebook ของรายวิชา|



**สิ่งที่ต้องท า (Required)** 

|**ID**|**สิ่งที่ต้องท า**|
|---|---|
|**R-01**็้  ื่  ่   ้้ั้|แพ็กแอปด้วย Docker เมื่อ build ใหม่จาก clean clone แล้วต้องรันได้|
|**R-02**|ค่าตั้งค่าทุกตัวอ่านจาก environment มี.env.example และไม่commit secret จริง|
|**R-03**ี       ั้|deploy บน GCP มี URL สาธารณะ และ domain workflow ท างานครบทั้ง UI, API และ database|
|**R-04**|ใช้ฐานข้อมูลถาวร ข้อมูลต้องยังอยู่หลัง restart และหลัง redeploy|
|**R-05**ุ  ี่ี่้้ั     ี่ี|ทุก PR ที่เกี่ยวข้องต้องรัน build และ automated tests ที่มีความหมาย|
|**R-06**|ตั้ง required check ให้PR ที่check ไม่ผ่าน merge ไม่ได้สาธิตด้วย temporary branch และห้ามท าให้แอปที่release แล้วพัง|
|**R-07**่  ี่  ้้|deploy จาก main ผ่าน pipeline ที่ท าซ ้าได้ (review→CI→merge→deploy) มี manual approval ใน pipeline ได้|
|**R-08**|ระบุได้ว่าแต่ละ release มาจาก commit ไหน และเขียนขั้นตอน release ที่ท าซ้าได้ไว้ใน deployment.md|
|**R-09**|<sup>ใช้ Issue, project board และ feature/fix branch เปิด PR เข้า staging ให้เพื่อนร่วมทีม review แบบเจาะจง แล้วเปิด release</sup><br>PR จาก staging เข้า main ผู้เขียน PR ห้าม approve PR ของตัวเอง|
|**R-10**|ติด label lab5 ที่Issue และ PR ห้ามลบหรือเขียนทับ commit, contract revision และ CI run|
|**R-11**ิั้ีุ่่้ ัึี่่่|สมาชิกทั้งสองคนมีส่วนร่วมทุกด้าน และบันทึกการมีส่วนร่วมผ่าน Issue, commit และ PR|
|**R-12**|repo ต้องเป็น public จนกว่าจะตรวจเสร็จ ห้าม commit ไฟล์ .env รหัสผ่าน connection string หรือ key หากเผลอ push<br>secret ขึ้นไป ต้องเปลี่ยน secret ทันทีและแจ้ง TA|



**ข้อแนะน า (Recommended):** ควรตั้ง budget alert ก่อนสร้าง resource ทุกครั้ง เพราะ Cloud SQL คิดเงินทุกชั่วโมง 

**รูปแบบ PDF:** ใช้หัวข้อ Answer Part 0 ถึง 4 ตามล าดับ ใส่ลิงก์พร้อมค าอธิบายสั้น ๆ เป็นหลัก ใส่ภาพเฉพาะที่จ าเป็น ทุกภาพต้องมี caption ที่มีเลขก ากับ และบอกว่าพิสูจน์ check ข้อไหน ข้อความในภาพต้องอ่านได้ที่ซูม 100% และต้องไม่เห็น secret 

-11- 

