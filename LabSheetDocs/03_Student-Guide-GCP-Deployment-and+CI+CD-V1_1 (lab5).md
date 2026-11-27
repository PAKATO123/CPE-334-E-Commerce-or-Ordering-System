## **Student Guide: GCP Deployment and CI/CD** 

Version 1.1 — 28 Oct 2026 

### **How to use this guide** 

Each episode lists what must be done first, the issue it closes, the commands to run, and a **"Done" when** checked. 

Replace these placeholders in every command with your team's values. None of them are **secret** . 

|Placeholder|Meaning|Example|
|---|---|---|
|`YOUR_PROJECT_ID`|GCP Project ID, set in Episode 1|`cpe334-sec1-team07`|
|`YOUR_REGION`|GCP region|`asia-southeast1`|
|`YOUR_GITHUB`|GitHub user or organization that owns the repo|`team07-cpe334`|
|`YOUR_REPO`|Repository name|`toktickit-webapp`|
|`staging`|Your sprint's staging branch|`staging`|
|`KIT`|Folder where you unzipped the Starter Kit,<br>outside the repo|`~/kit/toktickit-lab5-st`<br>`arter`|



Examples use the TokTickIT app. If your app uses different names, endpoints or scripts, adjust them. 

#### **Rules for the whole lab** 

- Never paste passwords, connection strings or keys into an AI chat, the repo, a screenshot or a group chat. 

- Read every <mark>`gcloud`</mark> command an AI suggests before you run it. Never let an AI change billing, IAM or the database on its own. 

- Cloud SQL is the main cost. It is billed for every hour it is running. 

#### **Content** 

<u>How to use this guide Guide/Episode 0: Overview Guide/Episode 1: GCP account and cost control Guide/Episode 2: From local to cloud – what changes Guide/Episode 3: Docker Guide/Episode 4: CI on pull requests Guide/Episode 5: First deployment to GCP Guide/Episode 6: Connect GitHub to GCP and set the merge gate Guide/Episode 7: Auto deploy and smoke test Guide/Episode 8: Persistence and rollback Guide/Episode 9: Pause when you are not using it Guide/Episode 10: Teardown at the end of term</u> 

### **Guide/Episode 0: Overview** 

Every change goes through a pull request and CI before it can reach <mark>`main` .</mark> A merge to <mark>`main`</mark> then builds an image and automatically deploys it to Cloud Run. If a release is bad, you redeploy an older image using its commit SHA. 

|Service|What it does|
|---|---|
|Docker|Packages the web UI, API and migration tools into<br>one image|
|Artifact Registry|Stores every image version|
|Cloud Run|Runs the app over HTTPS and scales to 0 instances<br>when idle|
|Cloud SQL (PostgreSQL)|Keeps data outside the container, so it survives<br>redeploys|
|Secret Manager|Stores `DATABASE_URL` and the admin password|
|GitHub Actions + Workload Identity Federation|Tests and deploys automatically, with no service<br>account key|



##### **0.1 Team Workflow Suggestion** 

1. Every task has an <mark>“</mark> **<mark>Issue”</mark>** <mark>.</mark> 

2. Create a branch from <mark>`staging` .</mark> 

3. Open a pull request into <mark>`staging` .</mark> A teammate reviews and approves it, then you merge. 

4. Open a release pull request from <mark>`staging`</mark> into <mark>`main` .</mark> 

5. Work done in the Console or in GitHub Settings has no branch, but it still has an Issue. Close that Issue with a screenshot as evidence. 

**Note** : Never commit directly to <mark>`staging`</mark> or <mark>`main` .</mark> Authors cannot approve their own pull requests. Deploys happen from <mark>`main`</mark> only. 

##### **0.2 What your app can use on GCP** 

Your team chose its own stack for the term project. For Lab 5, it must fit these rules. Your team adapts the kit to your stack yourselves. 

###### **Required (project spec)** 

- The app is packaged with **Docker** and deployed on **GCP** . 

- Every relevant PR runs **build and automated tests** , and a failed required check **blocks the merge** . 

- Releases deploy **from main** through a **repeatable pipeline** . 

- Data **survives a restart or redeployment** , so it lives outside the container. 

- Configuration is documented **without real secrets** . 

###### **Recommended (the kit is built for this)** 

- **Cloud Run** for hosting, **Artifact Registry** for images, **GitHub Actions** with **Workload Identity Federation** for CI/CD, and **Cloud SQL** for the database. 

- If you use something else, your team adapts the kit yourselves and explains the choice in your System-Level SDS. 

##### **0.3 What the Starter Kit gives you** 

The Starter Kit has ready-made files for TokTickIT. Copy them into your repo in the episode shown, then adapt them to your app (see 0.4 What to change for your project). Unzip the kit outside your repo. 

|**Episode**|**Branch**<br>**(example)**|**Kit files**|**What they do**|
|---|---|---|---|
|3|build/3-<br>docker|Dockerfile,<br>.dockerignore,<br>docker-compose.yml,<br>server/docker-entrypoint.sh,<br>client/nginx.conf,<br>server/Dockerfile,<br>client/Dockerfile|<br>Build one container with<br>the UI and API, and run it<br>locally with a database|
|4|ci/4-pr-<br>checks|.github/workflows/ci-docker.<br>yml, the wholedeploy/folder|Run build and tests on<br>every PR. CI also checks the<br>deploy scripts, so<br>deploy/comes in now|
|5|none|deploy/deploy.sh|One-time setup and first<br>deploy to GCP, run from<br>Cloud Shell|
|7|ci/7-dep<br>loy-pipe<br>line|.github/workflows/deploy.yml<br>(usesdeploy/release.shand<br>deploy/smoke_test.py)|Deploy automatically on<br>merge tomain, run the<br>smoke test, and roll back<br>withimage_tag|
|End of<br>term|none|deploy/teardown.sh|Delete the cloud resources|



##### **0.4 What to change for your project** 

The kit files are written for TokTickIT: a Node.js app with PostgreSQL and Prisma, with the UI and API in one container. Before you use a kit file, change the parts below to match your app. Search your repo for ToktickIT to find every name you need to change. 

|**What**|**Change**|**Episode**|
|---|---|---|
|Resource names|Servicetoktickit, jobtoktickit-migrate,<br>registrytoktickit, Cloud SQLtoktickit-pg,<br>databasetoktickit, secretstoktickit-*,<br>service accountstoktickit-runner,and<br>toktickit-deployer. Rename them the same<br>way everywhere, including the commands in this<br>guide.|3–7|
|Dockerfile,<br>server/docker-entryp<br>oint.sh|The base image, build commands, files copied into the<br>final image, and the port are all specified. The final<br>image must contain every file the server and the seed<br>need at run time.|3|
|docker-compose.yml|Services, ports, and environment variables for running<br>locally|3|
|ci-docker.yml|Install, migrate, seed, test, and build commands for<br>your stack. If you rename the job<br>test-and-docker, select the new name in the<br>ruleset (Episode 6).|4, 6|
|deploy/deploy.sh,<br>deploy/release.sh|The migration and seed commands, and the secrets<br>your app reads. The kit creates Cloud SQL for<br>**PostgreSQL**. If you use MySQL or SQL Server, change<br>the database version and connection settings (Cloud<br>SQL supports both). If your team uses a different<br>database, you will need to replace this part yourself.|5, 7|
|deploy/smoke_test.py|The endpoints it checks and the text it expects. Keep it<br>read-only and never use the admin account.|7|



**Keep these as they are** unless you know why you are changing them: 

- Workload Identity Federation instead of JSON keys 

- The full commit SHA as the image tag, and deploying by image digest 

- The if conditions on the test and deploy jobs in deploy.yml (they make rollback work) 

- Migrations that only add tables or columns, so an older image still works after a rollback 

##### **0.5 Console menus you will use** 

Go to the Google Cloud Console at <u>console.cloud.google.com.  Open the menu with ☰ at the</u> top left. Click the star ☆ next to a menu to pin it. If you cannot find a menu, type its name in the Search bar at the top. 

|Menu|Used for|Episodes|
|---|---|---|
|Billing→Budgets & caps|Track cost and set alerts|1|
|IAM & Admin→IAM|Who or which service can do what|1, 5|
|IAM & Admin→Service Accounts|Accounts for programs, not people|5, 6|
|IAM & Admin→Workload Identity<br>Federation|Lets GitHub Actions sign in to GCP without a key|6|
|APIs & Services|Each service must be enabled before use|5|
|Cloud SQL|The PostgreSQL database|5|
|Security→Secret Manager|Passwords and connection strings|5|
|Cloud Run|Runs the app; shows each revision|5, 7, 8|
|Artifact Registry (search)|Docker images|5, 7|
|Logging (search)|Errors from a failed deploy or migration|5|





<!-- Start of picture text -->
Y © Nant covscomputng sence: X @ myFietPjet-congeclude +<br>© © © Intps/consoecloudgogle com weleme/new Flo gos<br>% GoogleCloud<br>© Recent vied ><br>© Menino<br>WY maretpace &<br>WI APs Senices we ><br>H AgontPinsorn sed<br>@ computetngne se ><br>© Kiderratestngre fe ><br>S cousonge st ><br><!-- End of picture text -->

### **Guide/Episode 1: GCP account and cost control** 

Videos: LEB2 / Learn It / Student Guide: GCP Deployment and CI/CD (Video) / Episode 1 

Prerequisite: none 

Issue #1 (no branch) Criterion: GCP deployment and persistence 

##### **1.1 Get access to GCP** 

Use the access method your instructor announces. If your team signs up for the Free Trial itself, follow these steps. 

###### **Before you start** 

- Use a **personal Gmail account** that has never used the Free Trial. 

- **Do not use your university account (@mail.kmutt.ac.th).** Signing up with it can end in a prepayment request instead of the free credits. 

- Have a credit or debit card ready. Google places a temporary **authorization of about 900 THB** on the card to verify it. This amount is not a charge; it is released within about a week. A debit card needs enough balance. 

###### **Steps** 

1. Go to **<u>cloud.google.com/free</u>** and click on **Get started for free** . 



<!-- Start of picture text -->
Google Cloud Owniew sotens Poa asco ose sp :@ GD<br>Free to sign up. Free monthly usage.<br>Buld apps, analyze data, and deploy agents with Al for fre.<br>Three ways to get started for free<br>$200in{reecreitfornew customers _Start bulkingwith Al for free 20+ productswith feeter<br><!-- End of picture text -->

2. Sign in with your personal Gmail account. Check the account shown at the top right before you continue. 



<!-- Start of picture text -->
x<br>Free to sign up. Free monthh @ Crees te<br>Buld opps, analyze deta, nd deploy agents with Alf<br>Adair eet<br>& sonout<br>6G aep yur Googeect<br>+ cotacongin<br>Three ways to get started for free<br>$300 in free credit for new customers Start bulding with Alfor free 20s products with ree tier<br><!-- End of picture text -->

3. Choose your country ( **Thailand** ), read and accept the Terms of Service, and click **Continue** . 



<!-- Start of picture text -->
Step 1 of2 Account Information Access to Google Cloud products<br>Cc}‘cpessarest2640gmal CPES34-test  com soucnasnantees ‘andpps,thewebsites and Google Maps servesAPI. including rebace .<br>country $300 in free credit<br>crm ea<br>‘By using this application,you agree to the Google Cloud Platform( No automatic charges<br>Termsoferie tuAayaanig pereeyouge ten owtcounochoyrhae.pep<br>e<br>\ @ e<br><!-- End of picture text -->

4. On Step 2 of 2 Payment Information Verification, fill in your Contact information: click Add name and address, enter your name and address, and save. If the form asks for an account type, choose **Individual** . 



<!-- Start of picture text -->
© Try Google Cloud for free<br>Step 2 of 2 Payment Information Verification Access to Google Cloud products<br>Doritil worry, nicbevieingetomtis this trallisis  fe. howrannyrestCol ectingco l  cael your paymentareleiranpiy information; vethelps Getapps, everything websites you need and services, to bulld including and run Firebase your<br>manually activatea fullpy-asyou go accountof choose to prepay. and the Google Maps API.<br>$300 in free credit<br>Contact information Try Google Cloud with $300 in credit to spend<br>over the next 90 days.<br>‘Add name and address b + ,<br>No automatic charges<br>Your nfois saved n« payments patie and shared across Google services Youfull, onlypay-as-you-gostart payingaccountif you decideor choose to activateto prepay.a<br>‘Any remaining free credit is yours to keep.<br><!-- End of picture text -->

5. Under Payment method, click Add payment method, enter your card details, and save. Confirm with the OTP from your bank if asked. 



<!-- Start of picture text -->
& Try Google Cloud for free<br>Step 2 of 2 Payment Information Verification Access to Google Cloud products<br>oo ths ils fe. col et Get everything you need to build and run your<br>Us ritverity worryyour this identitytrials stl free, Collecting your payment information helps =<br>manually activate a fullto pay-asyou goreduce fraud. account You wont or choosebe charged to prepay. unless you cshisiancerenaplioiliaaea‘ae the Googie Maps API hind<br>$300 in free credit<br>Contact information Try Google Cloud with $300 in credit to spend<br>(CPES34-test over the next 90 days.,<br>Indiv -Thad 10: No automatic charges<br>You only start paying if you decide to activatea<br>Payment method full, pay-as-you-go account or choose to prepay.<br>‘Any remaining free credit is yours to keep.<br>Add paygent method +<br>e<br>Ta<br><!-- End of picture text -->

###### **Note: card verification and prepayment** 

- Your bank may show a **temporary hold of about 900 THB** , or it may show nothing. Both are normal. The hold is a verification, not a charge, and is released within about a week. A debit card needs enough balance to cover it. 



<!-- Start of picture text -->
A temporary THB 900.00 authorization will be<br>placed on your card to ensure your card is<br>valid. This authorization is typically removed<br>within a week.<br>aiid } continue |<br><!-- End of picture text -->

   - Use a card that has **never been used for a Google Cloud Free Trial** . A card that has been used before can stop you from getting the free credits. 

   - If GCP asks for a **prepayment** instead of starting the free trial, **do not pay** . Close the page and sign up again with a different personal Gmail account and a card that has not been used for a Free Trial. 

6. Click **Start free** . 



<!-- Start of picture text -->
© Try Google Cloud for free<br>Step 2 of 2 Payment Information Verification Access to Google Cloud products<br>verify your identity Get everything you need to build and run your<br>Doritus‘manually worryactivate ths trasto stilreduc fe e .fraud,Collecting You yourworpaymenbe charged t  informationuniess you helps ‘apps, f websites and services," including Firebase .<br>a ull pay-asyou go account orchooseto prepay. {and the Google Maps APL<br>$300 in free credit<br>Contact information ‘Try Google Cloud with $300 in credit to spend<br>over the next 90 days.<br>cPea24-testIndvidvl > Thaond 0; eauaaneaane No automatic charges<br>You only start paying if you decide to activatea<br>Payment method full, pay-as-you-go account or choose to prepay.<br>‘Any remaining free credit is yours to keep<br>© Mestercard -wooe change<br><!-- End of picture text -->

_The Google Cloud Console opens._ 



<!-- Start of picture text -->
{i penvatemn enor ona dae Ugo aca oe racer Sond Sasa ave cut ano wha ne ome CD<br>= Googe Cloud fe Myfirst Project ‘Seren fo resources,doce, product,end none Q search +90:@<br>© Welcome, CPE334-test. 0 YN °<br>‘eure Feo ‘ove 9 Ty Gemini Cloud<br>Gy) cowerotesoasraorecrsceunea7 =©—— ° Assist cat<br>See recommendations based on your interests in ox» soem manna +<br>Products<br><!-- End of picture text -->

7. Open ☰ → **Billing** → **Overview** . There must be no red banner. 



<!-- Start of picture text -->
| = | cooge cioue My FratProje tert trenee esd edeen Q search +500:@6<br>‘ . NN<br>© Welcome, CPE334-test A<br>Youre n Free Tol 3 1 Try Gemini Cloud<br>=) caustbionecwtteont =es -ASsst chat<br><!-- End of picture text -->



<!-- Start of picture text -->
X Google Goud ]<br>0 tum a><br>WY versie we<br><!-- End of picture text -->



<!-- Start of picture text -->
i Free trial credit<br>THB10,078<br>BD) eeriatcrest<br>90<br>BLD) concerning<br><!-- End of picture text -->

8. Open **Billing** → **Credits** . You should see **USD 300** and the expiry date. 



<!-- Start of picture text -->
= Googe coud Sec  reese don peo om Era +95:@<br>Cotes sed Ceci<br>=<br><!-- End of picture text -->

###### **If something goes wrong** 

- Do not click **Upgrade** unless your team has agreed to pay. 

- If GCP asks for a **prepayment** or says the billing account is closed, do not transfer money. Take a screenshot and tell your TA. 

**Done when:** Billing → Credits shows USD 300 and Billing → Overview has no red banner. 

**References** : <u>Google Cloud Free Trial FAQs</u> · <u>Free Trial and free features</u> 

##### **1.2 Create a project** 

Start at **<u>console.cloud.google.com</u>** and sign in with the same personal Gmail account you used for the Free Trial. 

###### **Steps** 

1. In the top bar, click the **project picker** next to the Google Cloud logo. It shows the current project name, for example “My First Project”. 



<!-- Start of picture text -->
= Google Cloud Gee Q search<br>© Welcome,: CPE334-test: DN<br>Youre in Free Trial Youre working cnec Try Gemini Cid<br>ee - Assist chat<br><!-- End of picture text -->

2. In the dialog that opens, click **New Project** at the top right. Shortcut: you can also go straight to console.cloud.google.com/projectcreate. 



<!-- Start of picture text -->
Select a resource i<br>cped34test26-org ¥ ay<br>I search projects and folder<br>(en<br>Recent Starred All<br>| Name Type iD<br>Y  & MyFirst Project @ Project Oe) x<br>BB cpe334test26-org@ Organization a=»<br>i<br>Cancel<br><!-- End of picture text -->



<!-- Start of picture text -->
New Project<br>My Project 11159 ®<br>ProjectID: sunlit-arcade-51272047. It cannotbe changed later. Edit<br>My Billing Account<br>Any charges for this project wil be billed to the account you select here.<br>cpe334test26-org + @<br>Select an organization to attach it to a project. This selection can't be changed later.<br>Bh cpe334test26-org Browse<br>Select the organization or folder where this resource willbe created<br><!-- End of picture text -->

3. In **Project name** , type a name that includes the **course code** and either your **team name** or your **project app name** , so everyone can tell which project it is. For example: 

   - CPE334 Team07 

   - CPE334 TokTickIT 



<!-- Start of picture text -->
New Project<br>$a<br>Projet mm ® $a iiii<br>CPE334-2026 ToktickIT fo)<br>Project ID: cpe334-2026-toktickit. It cannot be changed later. Edit<br><!-- End of picture text -->

4. Under the name, the form shows the **Project ID** it will use. Click **Edit** and set an ID that matches your project name, for example cpe334-team07 or cpe334-toktickit . 

   - 6 to 30 characters: lowercase letters, numbers and hyphens only. 

   - It must start with a letter and cannot end with a hyphen. 

   - It must be unique across all of Google Cloud. If it is taken, add a number at the end. 

   - **The Project ID cannot be changed after you click Create.** You will type it in every command in this lab. 



<!-- Start of picture text -->
Project 0°<br>| PEcit ec<br>Project ID can have lowercase letters, digits, or hyphens. It must start with a lowercase<br>letter and end witha letter or number.<br><!-- End of picture text -->

5. Under **Billing account** , choose the account created by your Free Trial. It is usually called **My Billing Account** . 

6. Under **Location** , a personal account shows **No organization** . Leave it as it is. 



<!-- Start of picture text -->
( No organization<br>cpe334test26-org<br><!-- End of picture text -->

7. Click **Create** . Wait for the notification (bell icon, top right) to say the project was created. This usually takes under a minute. 



<!-- Start of picture text -->
New Project<br>‘a. Youhave 10 projects remaining in your quota. Request an increase<br>or delete projects. Learn moreZ<br>Manage Quotas %<br>|, CPE334-2026 ToktickIT<br>| EEEProjectletter andID endcan withahave lowercase0letter or numberletters, digits, or hyphens. It must start with a lowercasee<br>| Noorganization +<br>Select an organization to attach it to a project. This selection can't be changed later.<br>|B No organization Browse<br>Select the organization or folder where this resource willbe created<br>eons!<br><!-- End of picture text -->



<!-- Start of picture text -->
Q Search ¢B 4:<br>Notifications<br>O} Create Project: CPE334-2026 ToktickIT | in2minutes<br>Select Project<br>4 © Create Organization and Project 14 hours ago<br>@ Create Organization and Project 14 hours ago<br>®<br>See all activities<br><!-- End of picture text -->

8. Open the project picker again and **select your new project** . Check that the top bar now shows its name. 



<!-- Start of picture text -->
Select a resource New project )<br>folders<br>cpedddtestaeorg 1<br>Name ww a Type )<br><!-- End of picture text -->



<!-- Start of picture text -->
Select a resource New project i<br>(Cieorgenteston|(Nocrganization ~ )<br><7)<br>((@ search project an folders )<br>Recent Stared ___ Al<br>Name Wee ©<br>Vb cresse 2026 Texto EERE<br><!-- End of picture text -->



<!-- Start of picture text -->
= GoogeCaud ( ena a Qeenh +50:<br>wy e<br>© Welcome, CPE334-test. e NV<br>Youre in Free Tea ‘out wrking on rejects Try Gemini Cloud<br>con sno7ecectsues —ST Wo Aaattet<br>‘See recommendations based on your interestsin om Aen sant+<br><!-- End of picture text -->

9. Open ☰ → **Cloud overview** → **Dashboard** . In the **Project info** card, check the Project name, Project ID and Project number. Write down the **Project ID** for your team. 



<!-- Start of picture text -->
X Google Cloud<br>3 Cloud Hub ><br>Fil Cloud overview 5<br>Welcome<br>IE Solutions > Dashboard<br>© _ Recently visited ><br>Favorite products<br><!-- End of picture text -->



<!-- Start of picture text -->
$e Project info i<br>|CPE334-2026Project name ToktickiT<br>Project number<br>906251530807<br>a<br>‘Add peopleto this project<br>> Gotoproject settings<br><!-- End of picture text -->

**Note:** You can rename “My First Project” instead, but its Project ID is random and cannot be changed, so a new project is recommended. Your team uses this one project from Lab 5 through the Final Project. **One team member creates it and adds the others in 1.3.** 

**Done when:** the top bar shows your new project and the Project ID in the Dashboard matches the one your team agreed on. 

**Reference** : <u>Creating and managing projects</u> 

##### **1.3 Add your teammates** 

<mark>IAM & Admin → IAM →</mark> **<mark>Grant access</mark>** <mark>→ enter a teammate's email → role</mark> **<mark>Editor</mark>** <mark>→ Save.</mark> 

###### **Before you begin** 

- Only the team member who created the project does this step. 

- Collect each teammate’s personal Gmail address. Use the accounts they will use for the lab, not @mail.kmutt.ac.th. 

- Check the project picker in the top bar. It must show your team’s project, not “My First Project”. 

###### **Steps** 

Start at **<u>console.cloud.google.com/iam-admin/iam</u>** <u>.</u> 

1. Click **Grant access** at the top of the IAM page. 



<!-- Start of picture text -->
= Googecioud ( cneintast aire pode Cony +20:<br>© mwsnami aM ‘etm<br>| 2mm _<br>= Permissions for project *CPE334-2026 ToktickIT”<br>2 Gore Crean coo pron gts<br>2 foes Viewpoint ee<br>Ait“ Morapes Workoae ie OC8Yee Preciponttinttognacm toeCREA oteOmer Secartyiights ,<br><!-- End of picture text -->

2. Under **Add principals** , in **New principals** , enter your teammates’ Gmail addresses, one at a time or separated by commas. 



<!-- Start of picture text -->
Grant access to "CPE334-2026 ToktickIT"<br>Grant principals access to this resource and add roles to specify what actions the<br>principals can take. Optionally, add conditions to grant access to principals only<br>whena specific criteria is met. Learn more about IAM conditions<br>Resource<br>$¢ CPE334-2026 ToktickiT<br>Add principals<br>Principals are users, groups, domains, or service accouny Learn more about<br>principals in AMZ<br>New principals *<br>EEE @.om2ilcom X @<br><!-- End of picture text -->

3. Under **Assign roles** , click **Select a role** , type **Editor** , and then choose **Editor** (under Basic). 



<!-- Start of picture text -->
Assign roles<br>Roles are composed of sets of permissions and determine what the principal can<br>do with this resource. Learn moreZ<br>Role * IAM condition (optional) @<br>Editor ¥<br>View, create, update, and Goete<br>most Google Cloud resources. See<br>the lst of included permissions.<br>+ Add another role<br>+} Help me choose roles<br>Save Cancel<br><!-- End of picture text -->

4. Click **Save** . 

5. Back on the IAM page, open **View by principals** and check that each teammate is listed with the **Editor** role. 



<!-- Start of picture text -->
= Filter Enter property name or value<br>© type Principal 4 Name Role Security insights @<br>Os cpe334test26@gmail.com CPE334-test Owner va<br>oes HER e.g ait.com Editor c<br><!-- End of picture text -->

6. Ask each teammate to open **<u>console.cloud.google.com</u>** , select your project in the project picker, and confirm they can see it. 

###### **Note:** 

- Add only the teammates who work on this project. Do not add friends from other teams or anyone outside your team. 

- Give **Editor** , not **Owner** . Editor can create and change resources but cannot change who has access or manage billing. Owner can also add or remove people and delete the project, so keep Owner with the one person who created the project. 

- When someone leaves the team, remove them: IAM page → select the person → **Remove access** . 

**Done when:** every teammate appears on the IAM page with **Editor** and can open the project from their own account. 

**Reference** : <u>Quickstart: Grant roles in the Google Cloud console</u> 

##### **1.4 Open Cloud Shell and check billing.** 

Cloud Shell is a terminal in your browser with gcloud, git, and Docker already installed. You will use it later. 

###### **Before you begin** 

- Finish 1.2. The project picker in the top bar must show your team’s project. 

- Paste into Cloud Shell with **Ctrl+Shift+V** or right-click → **Paste** . 

- Variables such as PROJECT_ID are lost each time Cloud Shell closes. Run the export line again every time you open a new session. 

###### **Steps** 

1. Click the **Activate Cloud Shell** button ( **>_** ) at the top right of the Console. A terminal opens at the bottom of the page. The first start can take about a minute. 



<!-- Start of picture text -->
focucts. and more Q search + #/B)o:@<br><!-- End of picture text -->



<!-- Start of picture text -->
rE) = +e °<br>e<br>© Welcome, CPE334-test<br><!-- End of picture text -->

2. If a pop-up asks you to **Authorize Cloud Shell** , click **Authorize** . The output must be the same Gmail account as the avatar at the top right of the Console. If not, switch accounts before you continue. 



<!-- Start of picture text -->
Lr ore Jom  @ O@BO!|_e ax<br><!-- End of picture text -->



If the welcome message already says your project is set, continue anyway. Steps 3–4 make sure the terminal uses the right project. 

3. Check which account the terminal uses: 

gcloud auth list --filter=status:ACTIVE --format='value(account)' 



4. Set your project. Replace YOUR_PROJECT_ID with your team’s Project ID from 1.2: 

export PROJECT_ID=YOUR_PROJECT_ID 

gcloud config set project "$PROJECT_ID" 

The output says Updated property [core/project] . The prompt then shows your Project ID in yellow. 



<!-- Start of picture text -->
cpe334test26@cloudshell:~ (cpe3: oktickit)$ gcloud config set project "$PROJECT ID"<br><!-- End of picture text -->

4. Check that the terminal and the Console use the same project: 

gcloud config get-value project 

The output first shows your active configuration, then your Project ID. The Project ID must match the project shown in the project picker in the top bar. 



<!-- Start of picture text -->
| coe334test26@cloudshell:~ (epe33é tickit)$ acloud config get-value project<br><!-- End of picture text -->

5. Check that billing is enabled for the project: 

gcloud billing projects describe "$PROJECT_ID" --format='value(billingEnabled)' 

The output must be True . If it is False , go to ☰ → **Billing** → **Account management** and link the project to your Free Trial billing account, then run the command again. 



<!-- Start of picture text -->
334t @cloudshell:~ (epe3 ickit)$ gcloud billing 8 describe * T_ID" ma<br>alue (billing!<br><!-- End of picture text -->

**Done when:** step 2 shows your account, step 4 matches the top bar, and step 5 prints True . Keep the screenshot of True for Issue #1. 

**Reference** : <u>Launch Cloud Shell</u> 

##### **1.5 Set a budget** 

A budget sends email alerts when your spending reaches a set amount. A budget **only sends alerts** ; It **does not stop spending** . Expect about USD 14–18 per month per project, mostly Cloud SQL (Oct 2026 estimate, before tax and credits). 

###### **Before you begin** 

- Finish 1.4 Billing must print True . 

- Agree with your team on a monthly amount, for example, USD 10, and who should receive alerts. 

###### **Steps** 

Start at **<u>console.cloud.google.com/billing</u>** and choose your Free Trial billing account (usually **My Billing Account** ). 



<!-- Start of picture text -->
% Googie Goud<br>© ety tes ><br>Oana p<br>WY renege<br>@ conpastngne st ><br>© heoratertrore st ><br><!-- End of picture text -->

1. In the left menu, under **Cost control** , click **Budgets & caps** , then click **Create new** . If it asks what to create, choose an **alerts-only budget** . 



<!-- Start of picture text -->
= Googe Cloud — ase +#00:@<br>© Bing B Budgets cape eisn<br>ip omen Biling<br><!-- End of picture text -->

###### 2. **Define** 

- Choose **Alerts only (available to all services)** . Do **not** choose **Spend cap enforcement** . It pauses services when the cap is reached, and your app could stop during class or while it is being graded. 

- **Name** : for example, CPE334-Alert 

- Click **Next** . 



<!-- Start of picture text -->
@ Define<br>© Alerts only (available to all services) @<br>O iis Spend cap enforcement (available for limited services) @<br>Enforced spend caps will pause your usage, including commitments such as<br>CCUDs. on specified services untilfted,<br>CPE334-Alert<br>Next<br><!-- End of picture text -->

###### 3. **Scope** 

- **Time range** : **Custom range** . Start date: today. End date: **15 December 2026** (or your Final Project deadline). 

- **Projects** : select **only your team’s project** . 

- **Services** : leave **All services** . 

- **Savings** (discounts and credits): **clear all of them** , so the budget counts your actual usage while the free credit pays the bill. 

- Click **Next** . 



<!-- Start of picture text -->
€ Create Budget<br>@ Scope<br>Custom range ~<br>Budgets begin and end on dates st by you<br>somes a<br>Usage dataisavalobe from Jan, 2017<br>vensres a<br>1 Noend date<br>7 Read-oniy for project users (single-project budgets only)<br>Marking a budget read-only for project users restricts any inadvertent edits<br>toimportant budgets tracked centrally<br>A budget can be scoped to focus<br>on a specific set of resources.<br>‘out of 2 projects -<br>‘Allservices (178) .<br>Savings @<br>Selected crits reapplied to the total est Budget racks the total cost minus any<br>1 savings programs @ v<br>1 other savings @ v<br><!-- End of picture text -->

###### 4. **Amount** 

- **Budget type** : **Specified amount** . 

- **Target amount** : choose an amount that suits your team. **The values below are an example, not a rule.** 

- Click **Next** . 



<!-- Start of picture text -->
@ Define<br>|<br>@ Scope<br>|<br>© Amount<br>Seta custom range budget amount<br>Specified amount . A<br>‘A fxed amount that your spend wile compared against<br>Next<br><!-- End of picture text -->

- **Where the example of USD 250 comes from** 

   - i. The Free Trial gives **USD 300** of credit for 90 days. 

   - ii. This project runs until mid-December, about 1.5 months. At about USD 

      - 14–18 per month, it should cost about **USD 21–27** in total. 

   - iii. USD 250 is most of the credit, with about USD 50 kept in reserve. If spending reaches 90% (USD 225), you still have time to find the problem before the credit runs out. 

      - iv. **Your team can choose a lower amount** , such as USD 30–50, if you want the percentages to be closer to what you expect to spend. Your app, region or resources may also cost more or less than this example. 

5. **Actions** 

   - Set thresholds on **Actual** cost. Example for a USD 250 budget: 

|**Threshold**|**Amount**|**What it means**|
|---|---|---|
|**10%**|**USD 25**|About what the whole project should cost|
|**20%**|**USD 50**|About twice the expected cost: check what is running|
|**50%**|**USD 125**|Clearly unusual: find the cause now|
|**90%**|**USD 225**|The credit is close to running out|





<!-- Start of picture text -->
© Actions<br>Set alert threshold rules<br>Send email alert notifications after the actual or forecasted spend exceeds a<br>percent of the budget or a specified amount. Learn more.<br>10 %| | B25 Actual + @<br>20 %| | B50 Actual + @<br>50 % | | B125 Actual + @<br>90 % B225 Actual x @<br>+ Add threshold<br><!-- End of picture text -->

- If you choose a different amount, adjust the percentages so the first alert is near your expected total cost. 

- **Manage notifications** 

   - **Email alerts to billing admins and users** : keep it ticked. This sends alerts to you, the person who created the Free Trial billing account. 

   - **Email alerts to project owners** : optional. In this lab you are the only owner, so this sends you the same email again. 

   - **Link Monitoring email notification channels to this budget** : tick this to alert your teammates. They have the Editor role (1.3), so the two options above do not email them. Select your project, then up to **5** email channels, one per teammate. If there are no channels yet, see below. 

   - **Connect a Pub/Sub topic to this budget** : leave it unticked. It is for sending alerts to programs, not people. 



<!-- Start of picture text -->
Manage notifications<br>Email alerts to billing admins and users <—<br>© Emailalerts to project owners 4<br>Link Monitoring email notification channels to this budget<br>Select a project and a maximum of 5 Monitoring email notification channels.<br>| Projcp e ctsaEEEtickit* Selecta project |<br><!-- End of picture text -->

- **Create email channels for your teammates (once)** 

If the list says **There are no available notification channels for this workspace** , create them first: 

- Click **Manage notification channels** . A new tab opens in Cloud Monitoring. The first visit can take a moment to load. 



<!-- Start of picture text -->
(NotificationThere  Chanare n elso available notification channels for this workspace.<br>CG] Manage notificationchannels_ | |<br>Pra erence bres STO ETS OTe rSrreMMPAG (2;<br><!-- End of picture text -->

- Next to **Email** , click **Add new** . 



<!-- Start of picture text -->
Tecan chr aero<br>© rspemeyee cap cts tntstmtet ae<br>~ 7 SI<br><!-- End of picture text -->

- Enter a teammate’s Gmail address and a display name, then click **Save** . Repeat for each teammate (up to 5). 



<!-- Start of picture text -->
Create Email Channel<br>wenaEmail addresses new alerts canbe created.set to receive notifications from your alerting<br>BEE core1com<br>User2 Teammate<br>cnet<br><!-- End of picture text -->

- Go back to the budget tab and click the refresh button (↻) next to Manage notification channels. 

- Select your teammates’ channels in the list. 



<!-- Start of picture text -->
M = Filter Typeto filter<br>All selected<br>Email<br>© & Us2 t e ammater<br>© | Manage notification channels<br>( Cancel oO )<br><!-- End of picture text -->

6. Click **Finish** . The budget appears in the list. 



<!-- Start of picture text -->
Manage notifications<br>Email alerts to bling admins and users<br>11 Email alerts to project owners<br>Link Monitoring email notification channels to this budget<br>{ cpe22IIEbicict Select aproject<br>User 2 Teammate<br>C1 Connecta Pub/Sui topic to this budget<br>SB cove’<br><!-- End of picture text -->

**Done when:** the budget appears in the list with your project and amount. Close Issue #1 with screenshots of Credits (1.1), the budget, and the True result (1.4). 

**Reference** : <u>Create, edit, or delete budgets and budget alerts</u> 

### **Guide/Episode 2: From local to cloud – what changes** 

Videos: none (self-check) 

Prerequisite: the Sprint 1 app runs locally Issue #2 Branch: refactor/2-cloud-ready (example) Criterion: Docker and reproducible configuration 

In Labs 1–4, you learned to build an app that runs on your laptop. In Lab 5, you take your team’s term project app to Google Cloud. This guide uses TokTickIT, the course example app, to show each step; apply the same steps to your own app. 

Cloud Run works differently from your laptop: each new deploy starts a fresh container, files saved inside the container disappear, Cloud Run chooses the port, and anyone on the internet can reach the app. This episode checks six things that work locally but break in the cloud. 

##### **2.1 Create the branch** 

###### **Before you begin** 

- Open your team’s repo in VS Code, then open a terminal ( **Terminal → New Terminal** ). The terminal must be in the root folder of the repo. 

- Check that you have no unsaved work: 

git status 

It should say nothing to commit, working tree clean . If not, commit or stash your changes first. 

###### **Steps** 

1. On your project board, move **Issue #2** to **In Progress** and assign it to yourself. 



<!-- Start of picture text -->
8 TokTickIT Delivery Asesinas to Wn<br>tating= Pi BE Toumime |) Rontrap ELM onc<br>© bactlog 6/5 cam +O Sprcied © Gara + Osmted 172) saimeo + OpRRevew 0/8<br>° i<br><!-- End of picture text -->

2. Update staging and create a branch from it: 

git switch staging git pull git switch -c refactor/2-cloud-ready 

refactor/2-cloud-ready is an example name. Use your team’s naming style, and keep the Issue number in it. 

3. Check that you are on the new branch: 

git branch --show-current 

The output must be the branch name you just created, for example 

refactor/2-cloud-ready .  Always branch from staging , not main . Your pull request goes back into staging in 2.5. 

##### **2.2 Check six points** 

**Goal:** find and fix what works on your laptop but breaks, or becomes unsafe, on Cloud Run. It is much easier to fix now than after you deploy. Check each point in your own code, fix what does not match in this branch, and copy this checklist into your pull request (2.5). 

###### **Checklist** 

###### **1. Uploaded files are not saved in a local folder.** 

Store them in the database or Cloud Storage. Files saved inside the container disappear on every deploy. 

**In** _TokTickIT: already OK. Files are saved as bytes in the database_ 

_( multer.memoryStorage() in app.ts )._ 

###### **2. The seed is safe for production.** 

Demo accounts are allowed (you will need them for UAT in Lab 6), but their passwords come from environment variables, never from code, and are not shown on screen. The seed is safe to rerun. 

**In** _TokTickIT: already OK ( server/prisma/seed.ts )._ 

###### **3. No dev shortcuts in production.** 

The Development Requester selector (or any way to pick a user without logging in) is off, and no default password is shown on the login page. If admins can set a default password for new users, the user must change it at first login. 

**In** _TokTickIT: already OK. The legacy user header is off by default, and the default password for new users must be changed at first login._ 

###### **4. Sessions are stored in the database, not in server memory.** 

Otherwise, users are logged out on every deploy or when Cloud Run adds an instance. 

**In** _TokTickIT: already OK ( server/src/auth.ts )._ 

**5. The server reads its port from PORT .** 

Cloud Run chooses the port. Do not bind only to localhost . 

**In** _TokTickIT: already OK ( server/src/index.ts )._ 

###### **6. /api/ready exists.** 

It returns 503 if the database cannot be reached. The smoke test uses it after every deploy. 

**In** _TokTickIT: already OK ( server/src/app.ts )._ 

If your app has none, see the example below. 

**If your app has no /api/ready** , add one. Example for Express and Prisma: 

app.get("/api/ready", async (_req, res) => { try { await prisma.$queryRaw`SELECT 1`; res.json({ status: "ready", db: "connected" }); } catch { 

res.status(503).json({ status: "not_ready" }); } }); 

Test it with your app running: open http://localhost:3000/api/ready in the browser. It should show ready . 

##### **2.3 Complete .env.example** 

**Goal:** anyone can copy .env.example to .env and know every setting the app needs, without seeing real secrets. Cloud Run will set these same variables. 

1. Find every environment variable your code reads. In Node.js, search for process.env (and import.meta.env in a Vite client). In other languages, search for the equivalent, for example, os.environ in Python or System.getenv in Java. 

2. Make sure each one is listed in server/.env.example or client/.env.example , with a brief comment and an example value. 

3. Never put real passwords or connection strings in this file. 

**In** _TokTickIT, the_ server reads 7 variables, but server/.env.example listed only 

DATABASE_URL and PORT . The fix adds the rest as comments, so local runs behave as before: 

# Runtime mode. The cloud uses "production." # NODE_ENV=development 

# First admin password for the seed. Required when NODE_ENV=production. # ADMIN_PASSWORD=change-me 

# Demo users and sample tickets. Default: on locally, off in production. # SEED_DEMO_DATA=false # DEMO_USER_PASSWORD=change-me 

# Allowed web origins, comma-separated (optional). # CORS_ORIGIN=http://localhost:5173 

# Old x-requester-id header for legacy tests. Never enable it in the cloud. # ALLOW_LEGACY_REQUESTER_HEADER=false 

Each line starts with #, so it is a comment: **copying this file to .env changes nothing on your laptop. Remove the # only when you want to set that variable.** Values such as change-me are placeholders, never real passwords. When you deploy to Cloud Run, Cloud Run sets NODE_ENV to production and reads ADMIN_PASSWORD from Secret Manager. 

##### **2.4 Run your tests.** 

**Goal:** make sure your changes did not break anything. 

Start your local database the way your team normally does. Run your app’s tests and build it. All must pass before you open a pull request. 

##### **2.5 Submit** 

1. Commit and push your branch: 

git add -A git commit -m "Prepare the app for the cloud (#2)" git push -u origin refactor/2-cloud-ready 

2. Open a pull request into **staging** . In the description, write Part of #2 and paste the checklist from 2.2. Tick each point and add a short note: what you changed, or “already OK”. 

3. A teammate reviews and approves it. Then merge. 

4. On the project board, move Issue #2 to **Done** . 

**Done when:** all six points are ticked, .env.example lists every variable the app reads, the tests pass, and the pull request is merged into staging . 

**References** : <u>Cloud Run container runtime contract</u> (port, listening address, and why files in the container are lost) · <u>The Twelve-Factor App: Config</u> (why settings go in environment variables) 

### **Guide/Episode 3: Docker** 

Videos: LEB2 / Learn It / Student Guide: GCP Deployment and CI/CD (Video) / Episode 3 Prerequisite: Episode 2 Issue #3 Branch: build/3-docker (example name; keep the Issue number) Criterion: Docker and reproducible configuration 

**Goal** : Package your app in Docker files and, if you can, run it on your computer with Docker Compose, so you know the container setup works before CI (Episode 4) and Google Cloud (Episode 5) use it. Nothing is deployed in this episode and nothing costs money. 

##### **3.1 What is required and what is recommended.** 

**Required** : the Docker files are in your repository and the Pull Request is open (steps 3.2, 3.3 and 3.6). 

**Recommended** : run them on your computer (steps 3.4 and 3.5). If you cannot install Docker, you can skip these two steps, but then you find problems later, in CI or on Google Cloud. 

**Adapt to your project** . The files come from the TokTickIT example (Node.js, React, PostgreSQL). If your team uses another stack, keep the same idea and change only the commands inside the files. Step 3.3 lists the lines to change. 

###### **Before you begin** 

- Episode 2 is merged into staging . 

- Your terminal is open in the root folder of your repository. 

- You have unzipped the Starter Kit **outside** your repository. 

- For steps 3.3 and 3.4 only: Docker is installed and running. Check with docker 

   - --version and docker compose version . If you have no Docker Desktop, use Google Cloud Shell, which already has both. 

##### **3.2 Create the branch and copy the kit files** 

**Before you begin:** git status is clean. 

###### **Steps** 

1. Get the latest staging , which includes Episode 2: 

git switch staging git pull 

2. Create the branch: 

git switch -c build/3-docker 



<!-- Start of picture text -->
4/3-docker<br>Switched to a new branch ‘build/3-docker*<br><!-- End of picture text -->

3. Copy these 7 files from the Starter Kit into the same places in your repository: 

|**File**|**What it does**|
|---|---|
|docker-compose.yml|Starts the database, the setup job, the API and the web app|
|server/Dockerfile|Builds the API image used by Compose|
|server/docker-entrypoint.sh|Starts the server inside the container|
|client/Dockerfile|Builds the web app|
|client/nginx.conf|Serves the built web app with nginx|
|Dockerfile|Root image that CI and Cloud Run use later (Episodes 4 and 5)|
|.dockerignore|Keepsnode_modules,.envand other files out of the images|





<!-- Start of picture text -->
Name Date modified Type Size<br>v Today<br>SB github 10/26/2026 9:32 AM File folder<br>TU client 10/26/2026 9:32 AM File folder<br>‘i deploy 10/26/2026 9:32 AM File folder<br>i docs 10/26/2026 9:32 AM File folder<br>‘TD server 10/26/2026 9:32 AM File folder<br>() dockerignore 10/26/2026 9:32 AM DOCKERIGNOREF<br>(7) docker-composeyml 10/26/2026 9:32 AM YML File<br>()) Dockerfile 10/26/2026 9:32 AM File<br>#) README 10/26/2026 9:32 AM Markdown Source<br><!-- End of picture text -->

###### <u>Starter Kit Treefile</u> 

|toktickit-lab5-starter/<br>||
|---|---|
|├──.dockerignore <br>|←Ep 3|
|├──Dockerfile <br>|←Ep 3|
|├──docker-compose.yml|←Ep 3|
|├──README.md<br>├──.github/<br>||
|│ ├──dependabot.yml<br>│ └──workflows/<br>||
|│ ├──ci-docker.yml<br>|←Ep 4|
|│ └──deploy.yml|←Ep 7|
|<br>├──client/||
|│ ├──.env.example<br>||
|│ ├──Dockerfile|←Ep 3|
|│ └──nginx.conf|←Ep 3|
|<br>├──server/<br>||
|│ ├──.env.example<br>||
|│ ├──Dockerfile|←Ep 3|
|│ └──docker-entrypoint.sh|←Ep 3|
|<br>├──deploy/<br>||
|│ ├──deploy.sh<br>|←Ep 5|
|│ ├──release.sh<br>|←Ep 7|
|│ ├──smoke_test.py<br>|←Ep 7|
|│ ├──teardown.sh<br>|←Teardown|
|│ └──tests/<br>||
|│ ├──test_deploy_stub.sh||
|│ ├──test_release_stub.sh||
|│ └──testsmoke.py||
|_<br>└──docs/||
|<br> ├──auto-deploy.md<br> ├──gcp-cicd-guide.md||
|└──gcp-first-lab.md||



###### 4. Run git status and check that exactly these 7 files are new. 



<!-- Start of picture text -->
Ps C:\Users\CPE KMUTT\Documents\GitHub\toktickit-webapp> git status<br>Jon branch build/3-docker<br>luntracked files:<br>(use “git add <file>..." to include in what will be committed)<br>-dockerignore<br>DockerFile<br>client/Dockerfile<br>client/nginx.<br>conf<br>docker-compose.ym<br>server/Dockerfile<br>server/docker-entrypoint.sh<br><!-- End of picture text -->

##### **3.3 Read the files before you run them** 

**Before you begin:** The 7 files are in your repository. 

###### **Steps** 

1. Open docker-compose.yml . Find the four services and say what each one does: ○ db : PostgreSQL with a volume, so data survives a restart. 



<!-- Start of picture text -->
2 db:<br>3 image: postgres:16-alpine<br>4 container_name: toktickit-db<br>5 restart: unless-stopped<br>6 environment:<br><!-- End of picture text -->

- migrate : runs once, applies the database migrations and the seed, then stops. 



<!-- Start of picture text -->
20 migrate:<br>21 build:<br>22 context: ./server<br>23 dockerfile: Dockerfile<br>24 container_name: toktickit-migrate<br>25 eStart: To<br><!-- End of picture text -->

- server : the API on port 3000. It starts only after migrate has finished. 



<!-- Start of picture text -->
37 server:<br>39 context: ./server<br>40 dockerfile: Dockerfile<br>: are, —_|<br>41 Container name: toKtickit-server<br>42 restart: unless-stopped<br>43 p> (dependsyon:<br>44 mb:<br>45 condition: SSRVieelhealthy<br>46 migrate:<br>a7 condition: servicecompleted_successfully<br><!-- End of picture text -->

- client : the web app served by nginx, on port 5173. 



<!-- Start of picture text -->
56 client:<br>57 build:<br>58 context: ./client<br>59 dockerfile: Dockerfile<br>60 args:<br>61 VITE_API_URL: ""<br>62 container name: toktickit-client<br>63 restart: unless-stopped<br>64 depends_on:<br>65 - server<br><!-- End of picture text -->

2. Check three things: 

   - No real password or secret is written in any Dockerfile ( ARG or ENV ). 

   - The passwords in docker-compose.yml are fallbacks for your own computer only. The cloud gets its values from Secret Manager in Episode 5. 

   - The final image contains every file the server and the seed need at run time (for TokTickIT: src/ , prisma/ , node_modules ). 

3. **<mark>If your stack is different</mark>** <mark>,</mark> change only these lines: 

   - the base image and the install and build commands in each Dockerfile; 

   - the port and the start command ( CMD ); 

   - the database image and the DATABASE_URL format in docker-compose.yml ; 

   - the command of the migrate service (your own migration and seed commands). 

###### **Reference – If your project uses a different stack** 

The Starter Kit Dockerfiles are written for Node.js. If your team uses another language or framework, write your own Dockerfile from the official guides instead of editing ours. 

###### **How to write a Dockerfile** 

- <u>Writing a Dockerfile – the basic instructions (</u> FROM , COPY , RUN , CMD ) 

- <u>Dockerfile best practices – small images, build cache, multi-stage builds</u> 

- <u>Dockerfile reference – every instruction in detail</u> 

###### **Docker’s guide for your language** 

(a recommended base image, Dockerfile and Compose file for each) 

- <u>Node.js</u> · Python · <u>Java</u> · Go · <u>PHP · .NET</u> · <u>Ruby</u> · <u>Rust</u> 

**Google Cloud’s guide for your language** (what Cloud Run expects from the app) 

- <u>Containerize your code for Cloud Run</u> 

- Quickstarts: <u>Node.js · Python</u> · Java · Go · <u>PHP</u> · <u>Ruby</u> · C# · Other languages 

- Frameworks: <u>Next.js</u> · <u>Python Flask</u> · Python FastAPI · <u>Node.js Express</u> 

**Whatever the stack, your image must:** listen on the port in the PORT environment variable on 0.0.0.0 , read all settings from environment variables, and keep no data on the container’s disk. See the Cloud Run container runtime contract. 

##### **3.4 Build and start everything (recommended)** 

**Before you begin:** Docker is running. Ports 3000 and 5173 are free. If you also run PostgreSQL on your computer, port 5432 must be free too. 

###### **Steps** 

1. Build the images and start the containers in the background: 

docker compose up --build -d 

* The first build takes a few minutes because Docker downloads the base images. 



<!-- Start of picture text -->
#33 [client] resolving provenance for metadata file<br>#33 DONE 0.05<br>[+] up 8/8<br>v Image toktickit-webapp-server Built 3.58<br>v Image toktickit-webapp-client Built 3.58<br>v Image toktickit-webapp-migrate Built 3.5s|<br>¥ Network toktickit-webapp_default created 0.25,<br>¥ Container toktickit-db Healthy 8.78<br>¥ Container toktickit-migrate Exited 14.5s<br>¥ Container toktickit-server ‘Started 14.78<br>¥ Container toktickit-client started 15.05,<br><!-- End of picture text -->

2. Check the state: 

docker compose ps -a 



<!-- Start of picture text -->
© PS C:\Users\CPE KMUTT\Documents\GitHub\toktickit-webapp> docker compose ps -a<br>NAME IMAGE coMmaND SERVICE CREATED sTaTus<br>PORTS.<br>toktickit-client  toktickit-webapp-client  "/docker-entrypoint..." client 11 minutes ago Up 13 minutes<br>0.0.0.0:5173->80/tep, [::]:5173->80/tep<br>toktickit-db postgres:16-alpine “docker-entrypoint.s.." db 11 minutes ago Up 13 minutes (he<br>althy) 0.0.0.0:5432->5432/tep, [::]:5432->5432/tep<br>toktickit-migrate  toktickit-webapp-migrate "./docker-entrypoint.." migrate 11 minutes ago Exited (0) 13 min<br>utes ago<br>toktickit-server  toktickit-webapp-server "./docker-entrypoint..". server 11 minutes ago Up 13 minutes<br>0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp<br>PS C:\Users\CPE KMUTT\Documents\GitHub \toktickit-webapp> []<br><!-- End of picture text -->

db , server and client must be running, and migrate must show **exited (0)** . A non-zero exit code means the migration or the seed failed (see the table at the end). 

3. Check that the API is alive and connected to the database: 

curl --fail http://localhost:3000/api/health curl --fail http://localhost:3000/api/ready 

- *On Windows PowerShell, type curl.exe instead of curl . 



<!-- Start of picture text -->
© PS C:\Users\CPE KMUTT\Documents\GitHub\toktickit-webapp> curl.exe --fail http://localhost :3000/api/health<br>@{("status”:"ok","service": "TokTickITPS C:\Users\CPE KMUTT\Documents\GitHub\toktickit-webapp> API") <— curl.exe --fail http://localhost:3000/api/ready<br>{"status":"ready","db":"connected"} <—<br><!-- End of picture text -->



<!-- Start of picture text -->
TokTickIT API Server<br><!-- End of picture text -->

4. Create one record in your app (for TokTickIT, a ticket) so that you can test persistence in the next step. 



<!-- Start of picture text -->
test DB testdb@db.com stat [ Active ] E<br>Reset<br>Password<br><!-- End of picture text -->

##### **3.5 Check that the data survives a restart (recommended)** 

**Before you begin:** You created a record in step 3.4. 

###### **Steps** 

1. Stop the containers but keep the data. 

docker compose down 

2. Start them again: 

docker compose up -d 

3. Sign in again. The record you created is still there, because it lives in the database volume, not in a container. 



<!-- Start of picture text -->
test DB testdb@db.com stat [ Active ] E<br>Reset<br>Password<br><!-- End of picture text -->

4. If you want a clean database later (for example after a failed first run), delete the volume too: 

###### docker compose down -v 

##### **3.6 Commit and open a Pull Request** 

**Before you begin:** git status shows only the 7 Docker files. 

###### **Steps** 

1. Commit and push 

2. On GitHub, open a Pull Request from build/3-docker into **staging** . 

3. In the description write Part of #3 , then write what you checked: all containers start, 

   - /api/health and /api/ready answer, a record survives a restart. If you skipped steps 3.4 and 3.5, write that instead. 

4. Move Issue #3 to _In review_ . Merge when your team has reviewed it 

##### **Done when** 

- *The 7 Docker files are in your repository and contain no real secret. 

- The Pull Request into staging is open with Part of #3 . 

- If you ran Docker: docker compose up --build -d starts everything without errors, /api/health and /api/ready answer, you can sign in, and your record is still there after down and up . 

***Note** : What “done” looks like depends on your project and the stack your team chose. The list above uses TokTickIT as the example (Node.js, React, PostgreSQL, ports 3000 and 5173, /api/health and /api/ready). Adapt each item to your own app: your own files and ports, your own health endpoint (or another way to show the app is running), your own database, and your own way to ensure that data survives a restart. 

**What must stay true for every team: t** he app starts from Docker files in the repository, it reads its settings from environment variables, no real secret is committed, and data is kept in the database and not in the container. 

#### **If something fails** 

|**What you see**|**What to check**|
|---|---|
|migrateexited with a<br>non-zero code|docker compose logs migrate. Usually a wrongDATABASE_URL,<br>a missing migration file, or a seed that needs an environment variable|
|Port already in use|Stop the other program, or change the left side of"3000:3000"or<br>"5173:80"|
|The page opens but sign-in<br>fails|docker compose logs server. Check thatmigratefinished and<br>the seed ran|
|Old data or old passwords<br>keep appearing|docker compose down -v, then start again|



#### **Official references** 

- <u>Dockerfile best practices – for adapting the Dockerfiles to your stack</u> 

- <u>Docker Compose overview</u> – the up and down commands used here 

- <u>Control startup order with depends_on</u> – why server waits for migrate 

- <u>PostgreSQL image on Docker Hub</u> – environment variables, or a different database version 

- <u>Cloud Run container runtime contract – what the image must do in Episode 5</u> 

### **Guide/Episode 4: CI on pull requests** 

Videos: LEB2 / Learn It / Student Guide: GCP Deployment and CI/CD (Video) / Episode 4 

Prerequisite: Episode 3 Issue #4 Branch: ci/4-pr-checks (example name; keep the Issue number) Criterion: CI and quality gate 

**Goal** : Make GitHub run your tests and a Docker build on every Pull Request, so broken code is caught before it is merged. This is the first part of the “CI and quality gate” criterion. In Episode 6 you will turn the result into a rule that blocks merging. No Google Cloud is used in this episode and nothing costs money. 

**Adapt to your project.** The workflow file is written for TokTickIT (Node.js, PostgreSQL, Prisma). If your team uses another stack, keep the same structure and change only the install, test and build commands. Step 4.2 lists what to change. 

###### **Before you begin** 

- The Pull Request from Episode 3 is merged into staging . 

- Your repository is on GitHub, and you can open the **Actions** tab. 

- You have unzipped the Starter Kit outside your repository. 

- Your terminal is open in the root folder of your repository, and git status is clean. 

##### **4.1 Create a branch and copy the CI files** 

**Before you begin:** Episode 3 is merged. 

###### **Steps** 

1. Get the latest **staging** 

2. Create the branch: ci/4-pr-checks 

3. Copy two things from the Starter Kit into your repository: 

   - .github/workflows/ci-docker.yml into the same place (create the folders if they do not exist) 

   - the whole deploy/ folder 

4. Run git status and check that the new files are <mark>.github/workflows/ci-docker.yml a</mark> nd the <mark>deploy/</mark> folder. 

**<mark>Why deploy/ now?</mark> The workflow checks the deploy scripts and runs their offline tests, so it fails without the folder. The scripts do nothing until you run them yourself in Episode 5.** 



<!-- Start of picture text -->
@ PS C:\Users\CPE KMUTT\Documents\GitHub\toktickit-webapp> git status<br>On branch ci/4-pr-checks<br>Untracked files:<br>(use "git add <file>..." to include in what will be committed)<br>-github/<br>deploy/<br><!-- End of picture text -->

##### **4.2 Read the workflow and edit the .github/workflows/ci-docker.yml** 

**Before you begin:** The files are copied. 

# **<mark>Why do we edit this?</mark>** <mark>a</mark> 

The kit’s workflow runs only for Pull Requests into **main** . In this guide every change goes into **staging first** , and main receives only release Pull Requests. If you leave the file as it is, your Pull Requests into staging get no check, and the first time CI runs is the release. Adding staging makes CI check each change before it is merged. 

**This edit may not be needed for your team.** Change the list to match your own branching: 

- If your team opens Pull Requests straight into main , keep [main] . 

- If your team uses a different integration branch (for example develop ), put that name in the list. 

- If you use more than one, list them all. 

The rule is simple: the branches list must contain every branch that your Pull Requests are opened into. 

**What the other two lines in on: are for** 

- <mark>workflow_call</mark> lets another workflow reuse this one. In Episode 7 the deploy workflow calls it, so the same tests run again before every release. Leave it as it is. 

- <mark>workflow_dispatch a</mark> dds a **Run workflow** button in the Actions tab, so you can start the checks by hand without opening a Pull Request. It is useful for testing the workflow itself. You can remove it if you do not want it. 

Only the pull_request lines decide which Pull Requests get checked. 

###### **Two more settings near the top of the file** 

- concurrency makes sure only one run of the checks is active per branch. With cancel-in-progress: true , when you push a new commit while a run is still going, GitHub cancels the old run and starts a new one. This saves time and runner minutes. A cancelled run is not a failure. 

- permissions: contents: read gives the workflow read-only access to your repository. It cannot push code, change settings or create 

###### **Steps** 

1. Open .github/workflows/ci-docker.yml . Find the on: section at the top and change the branches so that it runs for Pull Requests into both staging and main : 

on: workflow_call: pull_request: branches: [main, <mark>staging]</mark> workflow_dispatch: 

2. Read the job test-and-docker and say what each part does: 

   - **services: postgres:** starts a temporary PostgreSQL database for the tests. 

   - **Check the deploy scripts:** runs offline tests that never touch Google Cloud. 

   - **Install and test the backend:** applies the migrations, runs the seed, runs the tests. 

   - Install, test and build the frontend. 

   - **Verify the Docker build:** runs docker build on the root Dockerfile and does not push it anywhere. 

3. Check three things: 

   - **permissions is contents: read** only. The workflow cannot change your repository. 

   - The workflow does not sign in to Google Cloud. That comes in Episode 7. 

   - The job is named test-and-docker . Keep this name, because Episode 6 uses it as the required check. 

4. **<mark>If your stack is different</mark>** <mark>,</mark> change only these steps: 

   - the database service (image, user, password) to match your database; 

   - the setup step (for example pip install , mvn , dotnet restore ) and the **commands** that run your migrations, seed and tests; 

   - the frontend step, if your frontend has a different build **command** ; 

   - the docker build path, if your Dockerfile is not in the root. Keep the job name, the on: section and the permissions. 



<!-- Start of picture text -->
! ci-dockeryml UX | @ READMEmd8<br>!<br>1 name: CI & Docker Build<br>2<br>3 Yon:<br>4 workflow_call:<br>5 v pull_request:<br>6 branches: [main, staging]<br>7 workflow_dispatch:<br>8<br>9<br>10 © permissions:contents: read<br>un<br>12 ¥ concurrency:<br>13° | group: ci-${{ github.workflow }}-${({ github.ref }}<br>14 cancel-in-progress: true<br>4s<br>16 v jobs:<br>17 ~ | test-and-docker:<br>18 runs-on: ubuntu-latest<br>19 timeout-minutes: 30<br><!-- End of picture text -->

##### **4.3 Commit and open a Pull Request into staging** 

**Before you begin:** The on: section is edited. 

###### **Steps** 

1. Commit and push: ci/4-pr-checks 

2. On GitHub, open a Pull Request from ci/4-pr-checks into **staging** . In the description write Part of #4 . 

3. Scroll to the checks. A check named **CI & Docker Build / test-and-docker** starts by itself. It takes a few minutes. 



<!-- Start of picture text -->
=) toumpoumplt | toltickitwebapp + Q tA)<br><> Code © Issues 5 11 Pullrequests 1 G> Agents © Discussions © Actions fF Projects (1 Wiki © Securityand quality<br>Add Cl checks on pull requests #11 7<br>lbumpbumpll wantstomerge1 commit into staging from ci/4-pr-checks (I<br>Q Conversation 0 © Commits 1 EY Checks 1 Files changed 8<br>@ 22461 checks on pl requests (44) 205612 ~<br>1 & Docker Build<br>one a Di<br><!-- End of picture text -->

4. Wait until it is green. Open **Details** (or the **Actions** tab) and expand the steps to see each one pass. 



<!-- Start of picture text -->
© ton ©; tin eng tae<br>hen et :<br>Al worflows ‘ero<br>8 ~<br><!-- End of picture text -->

#### **4.4 If the check fails** 

**Before you begin:** The check shows a red cross. 

###### **Steps** 

1. Open **Details** , find the first step with a red cross, and expand it. Read the last lines of its log. 

2. Fix the problem in your branch, commit and push again. The check runs again by itself. 

3. Common causes are in the table at the end of this episode. 

##### **4.5 Merge, then make the first release to main** 

**Before you begin:** The check on the staging Pull Request is green. 

###### **Steps** 

1. Get an approval from a teammate if your team requires one, then merge the Pull Request into staging . 

2. Open a **release Pull Request** from staging into main (title for example “Release: CI and Docker files”). The same check runs again. When it is green and approved, merge it. 

3. This puts the workflow and the deploy/ folder on main . You need them there in Episodes 5, 6 and 7. 

4. Move Issue #4 to _Done_ . 





<!-- Start of picture text -->
8 TokTickIT Delivery 7 sisting Wesfone 7<br>© sured + OPRRelew 0/5) caimao +O Fake + O.bene 4 sent Pec:<br><!-- End of picture text -->

##### **Done when** 

- A Pull Request into staging starts the test-and-docker check by itself and it passes. 

- A Pull Request from staging into main starts the same check and it passes. 

- .github/workflows/ci-docker.yml and deploy/ are on main . 

**Note:** What passes depends on your project and your stack. The checks above use TokTickIT as the example. For your own app, “passes” means your own install, migration, test and Docker build steps all succeed, and the job keeps the name test-and-docker . 

#### **If something fails** 

|**What you see**|**What to check**|
|---|---|
|No check appears on the<br>Pull Request|The workflow file must be in.github/workflows/on the<br>branch, and theon:branches must include the branch the Pull<br>Request targets|
|deploy/step fails with<br>“No such file”|Thedeploy/folder was not copied or not committed. Rungit<br>status|
|Backend step fails on<br>prisma migrate<br>deploy|DATABASE_URLin the workflow must match theservices:<br>postgresvalues|
|Tests pass on your<br>computer but fail in CI|CI starts with an empty database and a clean install. Check that the<br>tests do not depend on data or files only you have|
|Docker build step fails|Rundocker build .on your computer and read the error. It is<br>the same build|
|Workflow does not start for<br>a first-time contributor|In the repository settings, Actions must be enabled|



#### **Official references** 

- <u>Building and testing Node.js</u> – the pattern this workflow follows. Other stacks: Python · <u>Java with Maven</u> · Java with Gradle · <u>.NET · Go</u> · <u>Ruby</u> 

- <u>Creating PostgreSQL service containers – the temporary database used by the tests</u> 

- <u>Workflow syntax: on.pull_request</u> – which branches start a workflow 

### **Guide/Episode 5: First deployment to GCP** 

Videos: LEB2 / Learn It / Student Guide: GCP Deployment and CI/CD (Video) / Episode 5 Prerequisite: Episode 1, 4 Issue #5 (no branch: you run a script; you do not change code) Criterion: GCP deployment and persistence 

**Goal** : Run the deploy script once, by hand, from Cloud Shell, so your app runs on Cloud Run with its data in a Cloud SQL database. From Episode 7 a pipeline does this for you; this first run lets you see and understand every resource. 

**Costs start in this episode.** Cloud SQL is billed for every hour it exists, even when nobody uses the app. Do Episodes 5 to 8 close together (ideally on the same day) and run the teardown in the last episode when you finish. Check that your budget alert from Episode 1 is in place before you start. 

**Adapt to your project.** <mark>deploy/deploy.sh</mark> is written for TokTickIT (PostgreSQL, one container on port 3000, Prisma migrations). If your stack differs, change the script before running it. The lines to change are listed in the Starter Kit README.md under “What to change for your project”, and in Episode 0, section 0.4. 

###### **Before you begin** 

- Your Free Trial is **active,** and billing is enabled (Episode 1). If the trial is still _Pending_ , do only 5.1 and 5.2 (they create nothing) and stop before 5.3. 

- Your budget alert exists. 

- The release Pull Request from Episode 4 is merged, so main contains your app, the Docker files, .github/workflows/ci-docker.yml and the deploy/ folder. 

- You know your **Project ID** (not the project name) and the region you will use, for example asia-southeast1 . 

- You have a quiet place to work: this episode shows a generated password (5.6), which you must never show on screen, in a screenshot or in a chat. 

#### **5.0 Adapt deploy/deploy.sh script** 

deploy/deploy.sh is written for TokTickIT (Node.js, PostgreSQL, Prisma, one container on port 3000). Do not run it on your app until you have read it and changed what does not fit. Always run the dry run (5.2) after every change. 

|**What to**<br>**check**|**Where in**<br>**deploy/deploy.sh**|**What to do**|
|---|---|---|
|**Names**|The variables at the top:<br>REPO_NAME,<br>SQL_INSTANCE,<br>DB_NAME,DB_USER,<br>SERVICE_NAME,<br>MIGRATE_JOB_NAME,<br>SA_NAME, and the secret<br>names<br>64 | REPO_NAME="toktickit<br>65 | SQL_INSTANCE="toktickit-pg”<br>66 | DB_NAME="toktickit”<br>67 | D8_USER="toktickit”<br>68 | SERVICE_NAME="toktickit”<br>69 | MIGRATE_J0B_NANE="toktickit-migr<br>70<br>|_SA_NAME="toktickit-runner"<br>71.<br>SREMATL="SSA MANES [PROTE<br>2<br>SQL_CONN_NAME="${PROJECT_ID}:${<br>73<br>IMAGE_URT="${REGION}-docker.pkg<br>74<br>75<br>SECRET_DB_URL="toktickit-databas<br>76<br>SECRET_ADMIN_PASS="toktickit-ad<br>7<br>SECRET_DEMO_PASS="toktickit-demo<br>8|Rename them to your app. Use the same names in<br>deploy/release.shand<br>.github/workflows/deploy.yml, or<br>Episodes 6 to 8 will not find them.<br>ate”<br>CT10} Tamgoerviceaccount. Com<br>REGION}:${SQL_INSTANCE}"<br>.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:latest”<br>e-url”<br>min-password™<br>-password”|
|**Database**<br>**engine**|Step 3,gcloud sql<br>instances create ...<br>--database-version=P<br>OSTGRES_16|<br>PostgreSQL: keep. MySQL: use aMYSQL_version.<br>SQL Server: aSQLSERVER_version (check the<br>cost, it is higher). Another database (MongoDB and<br>others): Cloud SQL does not offer it, so choose a<br>managed option with your lecturer first|





<!-- Start of picture text -->
m5 if [ “$0R¥AUNT = "2" J5 then<br>116 run_end geloud sql instances describe "$SQl_INSTANCE™ project “"SPROJECT_10"<br>117 —_run_end geloud sql instances create "$SQL_INSTANCE" --database-version-POSTERESIHG --edition-enterprise --tier=db-fi-micro --r<br>a run_end geloud sql instances create “$SQl_INSTANCE™ \<br>ma database-version-POSTORESIAS \<br>12 edition-enterprise \<br>123 tier=db-ft-micro \<br>1 rregion="$REGION" \<br>rav7 storage-type=S50 \<br>128 ackup-start-time-03:00project "$PROJECT_I0" \<br>vf<br>be fi<br><!-- End of picture text -->

|**What to**<br>**check**|**Where in**<br>**deploy/deploy.sh**|**What to do**|
|---|---|---|
|**Database**<br>**URL**|Step 6,DB_URL_VALUE=|The format belongs to your driver. Change it to the<br>connection string your app expects. Cloud Run<br>connects to Cloud SQL through a Unix socket at<br>/cloudsql/PROJECT:REGION:INSTANCE.<br>Check your language’s guide in “Connect Cloud Run<br>to Cloud SQL”|
|**Secrets your**<br>**app reads**|Steps 6 to 8 and<br>JOB_SECRETS<br>178<br>else<br>179<br>run_cmd gcloud<br>sql users <br>180<br>fi<br>181<br>DBURLVALUE-"postgresql://<br>182<br>run_cmd gcloud secrets crea<br>183<br>printf "%s" "$BBJURUJVAUUE"<br>isa<br>| fi<br>185<br>fi<br>186<br>199<br>200<br># 8. Optional Demo Password in Se<br>201<br>GOBYSECRETS="DATABASE_URL=$(SECRET_<br>202 v if<br>[<br>"$SEED_DEMO_DATA”<br>= “true”<br>J;<br>203 Vif<br>[ “$ORY_RUN”<br>= "1"<br>J5 then<br>204<br>run_cmd gcloud secrets describ<br>205<br>run_cmd gcloud secrets create <br>206<br>run_cmd gcloud secrets version<br>207<br>Vv<br>else<br>208 Y | if<br>| gcloud secrets describe <br>209<br>GENERATED_DEMO_PASSWORD="$(o<br>210<br>run_cmd gcloud secrets crea<br>211<br>printf "Ks" "$GENERATED_DEMO<br>212<br>fi<br>pis<br>fi<br>214<br>JOBYSECRETS-"s (JOBJSECRETS},DEM<br>215<br>fi|Keep one secret for the database URL. Replace the<br>admin and demo password secrets with whatever<br>your app needs at first start. Every secret must be<br>generated, never typed into the script<br> create "$DB_USER" --instance="$SQL_INSTANCE”<br>--password="$DB_PASS™<br>${08_USER}:${08_PASS}@localhost/${DB_NAME} ?host=/cloudsql/${SQL_CONN<br>te "$SECRET_DB_URL”<br>--replication-policy="automatic”<br>--project “$PR<br>| gcloud secrets versions add "$SECRET_DB_URL”<br>--data-file=-<br>--pro:<br>cret Manager when<br>--demo is passed<br>DB_URL}:<br>latest,ADMIN_PASSWORD=${SECRET_ADMIN_PASS}: latest”<br> then<br>e<br>"$SECRET_DEMO_PASS"<br>--project "$PROJECT_ID"<br> "$SECRET_DEMO_PASS”<br>--replication-policy="automatic” --project "$PROIE|<br>s add "$SECRET_DEMO_PASS"<br>--data-file=-<br>--project "$PROJECT_ID"<br>“$SECRET_DEMO_PASS” --project “$PROJECT_ID" >/dev/null 2>81; then<br>penss1<br>rand<br>-base64 16<br>|<br>tr<br>-d<br>‘/4="<br>|<br>cut -c1-14)Dd1!"<br>te<br>"$SECRET_DEMO_PASS”<br>--replication-policy="automatic” --project "$PRO<br>_PASSWORD”<br>| gcloud secrets versions add "$SECRET_DEMO_PASS”<br>--data-fi<br>0_USER_PASSWORD=${SECRET_DEMO_PASS}:<br>latest”|
|**Migration**<br>**and seed**<br>**command**|Step 10,--args "-c,npx<br>prisma migrate<br>deploy && npm run<br>prisma:seed"|Replace with your own migration and seed<br>commands (for examplealembic upgrade<br>head,php artisan migrate --force,<br>dotnet ef database update). The<br>command must be safe to run twice|



|**What to**<br>**check**|**dep**|**Where in**<br>**loy/deploy.sh**|**What to do**|
|---|---|---|---|
|**Port and**<br>**settings**|Step 11<br>--set<br>--mem<br>--min<br>--max<br>222<br>223<br>224<br>225<br>226<br>227<br>228<br>229<br>230<br>231<br>232<br>233<br>234<br>246<br>247<br>248<br>249<br>250<br>251<br>252<br>253<br>254<br>255<br>256<br>257<br>258<br>259<br>260<br>261|,--port 3000,<br>-env-vars,<br>ory,<br>-instances,<br>-instances<br># 10. Create/Update & Ex<br>run_cmd gcloud run jobs <br>--image "$IMAGE_URI"<br>\,<br>--region "$REGION"<br>\<br>--service-account<br>“$SA<br>--set-cloudsql-instance<br>--set-secrets<br>"$JOB_SEC<br>--set-env-vars “NODE_E<br>--conmand “sh”<br>\<br>--args "-cynpx prisma <br>--max-retries<br>1<br>\<br>--task-timeout<br>30@s<br>\<br>--project "$PROJECT_ID"<br>#11. Deploy Clou<br>run_cmd gcloud ru<br>--image "$IMAGE<br>--region "$REGI<br>--platform mana<br>--allow-unauthe<br>--service-accou<br>--add-cloudsql-<br>--set-secrets "<br>--set-env-vars <br>--min-instances<br>--max-instances<br>--memory 512Mi<br>--cpu1\<br>--port 3000 \<br>--project "$PRO|Set the port your container listens on. Keep<br>environment variables that are not secret here and<br>secrets in--set-secrets. Keep minimum<br>instances at 0 to save money<br>ecute Cloud Run Job for Migration + Non-destructive Seed<br>deploy "$MIGRATE_JOB_NAME"<br>\<br>_EMAIL”<br>\<br>s<br>"$SQL_CONN_NAME"<br>\.<br>RETS”<br>\<br>NV=production, TZ=Asia/Bangkok,SEED_DEMO_DATA=${SEED_DEMO_D}<br>migrate deploy && npm run prisma:seed"<br>\<br><br>d Run Service<br>n deploy “$SERVICE_NAME™<br>\<br>_URI"<br>\<br>ON"<br>\<br>ged \<br>nticated<br>\<br>nt "$SA_EMAIL"<br>\<br>instances "$SQL_CONN_NAME™<br>\<br>DATABASE_URL=${SECRET_DB_URL}:latest"<br>\<br> “NODE_ENV=production, TZ=Asia/Bangkok” \<br><br>@ \<br><br>3<br>\<br>\<br>JECT_ID"|
|**Public**<br>**access**<br>7|Step 11<br>--all<br>ted<br>~~251~~|,<br>ow-unauthentica<br>~~--allow-unauthe~~|Keep it only if your app must be reachable by<br>anyone (needed for the demo). If your organization<br>blocks it, see the table at the end<br>~~nticated\~~|
|**What**<br>**“healthy”**<br>**means**<br>|deplo<br>and the<br>|y/smoke_test.py<br>commands in 5.5<br>|Change the paths and the expected answers: your<br>own health endpoint, and a page or API that shows<br>the database works. Keep it read-only<br>|



|**What to**|**Where in**|**What to do**|
|---|---|---|
|**check**|**deploy/deploy.sh**||
|**Instance**<br>**name in**<br>**later steps**|5.4 and 5.7 in this guide|toktickit-pgandtoktickitappear in the<br>commands; use your own names|



**Keep as they are, unless you know why:** the dedicated runtime service account with only two roles (Cloud SQL Client on the project and Secret Manager Secret Accessor on each secret), generating passwords instead of typing them, the migration as a separate Cloud Run job that runs before the service is updated, storage auto-increase off, and the “skip if it already exists” checks that make the script safe to run again. 

**If you are unsure, ask before you run it:** the first real run creates a Cloud SQL instance, which costs money from the first hour. 

#### **5.1 Prepare Cloud Shell** 

**Before you begin:** You are signed in to the Google account that owns the project. 

###### **Steps** 

1. Open the Google Cloud Console, select your project, and open **Cloud Shell** with the terminal button in the top bar. 



<!-- Start of picture text -->
= Google Cloud (+ crest 2024 tier . : a ——++[5] 6 e<br><!-- End of picture text -->

2. Check that the CLI uses the same account as the Console: 

gcloud auth list --filter=status:ACTIVE --format='value(account)' 



3. Set your project and region (replace the values with your own): 

export PROJECT_ID=YOUR_PROJECT_ID export REGION=asia-southeast1 gcloud config set project "$PROJECT_ID" gcloud config get-value project 



<!-- Start of picture text -->
cpes3dtest26@cloudshell:~ (cpe334 ktlekit)$ export ROE<br><!-- End of picture text -->

4. Download your code and check the commit: 

git clone https://github.com/YOUR_ORG/YOUR_REPO.git cd YOUR_REPO 

git rev-parse --short HEAD 

This copies your code from GitHub into Cloud Shell, which is a separate computer in Google Cloud. Your computer is not changed. 



<!-- Start of picture text -->
peasttest26ecloudshell:~ (ope334 KtLokit)$ git clone https://github.con/1lbunpbumpll /toktickit-webapp.ait<br>Cloning into ‘toktickit-webapp'<br><!-- End of picture text -->

**The commit must match the latest commit on main in GitHub. If you cloned before, use the existing folder and run git pull instead of cloning again. 



<!-- Start of picture text -->
toktickit-webapp vlc Pin © Watd<br>lbumpbumpll Merge pull request #12 from lbumpbumpll/staging @@ — aD 25 minw © sCommits<br><!-- End of picture text -->



<!-- Start of picture text -->
deploy<br>github/work£lows<br><!-- End of picture text -->

#### **5.2 Read the plan before creating anything** 

**Before you begin:** You are in the repository folder in Cloud Shell. 

###### **Steps** 

1. Run the script in dry-run mode. It prints every command and creates nothing: 

DRY_RUN=1 PROJECT_ID="$PROJECT_ID" REGION="$REGION" bash deploy/deploy.sh 

2. **<u>Read</u>** the output and find these steps in order: 

   1. Enable the Google APIs; 

   2. Create the Artifact Registry repository (where images are stored); 

   3. Create the Cloud SQL instance and the database; 

   4. Create the runtime service account and grant it `Cloud SQL Client`; 

   5. Create the database user, store the secrets in Secret Manager, and grant toktickit-runner Secret Manager Secret Accessor on each secret; 

   6. Build the image with Cloud Build; 

   7. Create and run the migration job on Cloud Run; 

   8. Deploy the Cloud Run service. 

3. The line “Deployment Completed!” <mark>at the end of a dry run is only a simulation.</mark> 



#### **5.3 Deploy for real** 

**Before you begin:** The dry run looked right, and billing is active. 

###### **Steps** 

1. Run the script: 

PROJECT_ID="$PROJECT_ID" REGION="$REGION" bash deploy/deploy.sh 

2. Wait. It takes about 10 to 20 minutes, mostly for Cloud SQL and the image build. **Do not cancel it.** 



3. If it fails, read the last lines of the log before you do anything. If it stops at the migration job, do not run the script again straight away; read the job log first (the script prints the command to see it). 

4. At the end the script prints the service URL. Copy it. 

**The script is safe to run again after a failure** : it skips resources that already exist. Passwords are generated for you and **stored in Secret Manager** ; they are not printed. 

**Demo accounts** : the script can also create sample users with the option --demo . Demo accounts are allowed in your project (you will need them for UAT in Lab 6), but their passwords must come from Secret Manager, never from code. Use --demo only if your team wants them now. 



<!-- Start of picture text -->
Execution | (toktickit-mtgrate-sarm]| bas successfully completed:<br>View details about this execution by running<br>geloud run jobs executions describe toktickit-migrate-zsrm<br>or visit nttps://console.cloud.google.com/run/jobs/executions/details/asia-southeast1/toktickit-migrate-z<br>+ gcloud run deploy toktickit ——image asia~southeast1-docker.pkg.dev/cpe33 ckit/toktickit/tokt<br>ice-account toktickit~runnerécpe ickit.iam.gserviceaccount<br>baso-url:latest ~-set-onv-vars NODE_ENV=production\,t2-Asia/Bangkok --min-instancescom --add-cloudsql-instances0 --max-instancescpe333 —<br>Deploying container to Cloud Run service [toktickit] in project [epe33¢ tickit] region [asia-sout]<br>OK Deploying new service... Done.<br>OK Creating Revision...<br>OK Routing traffic<br>OK Setting IAM Policy<br>Done.<br>Service [toktickit] revision [toktickit-00001-£27] has been deployed and is serving 100 percent of traffil<br>Service URL: https://toktickit-906251530807 .asia-southeasti-run.app<br>Deployment Completed!<br>Service URL  : https://toktickit-xvemayrawa~as-a.run.app<br>Health Check : https://toktickit-xvemyrawa-asa.run,app/api/health<br>Readiness Check: https://toktickit-xvemxyrawa-as-a.run.app/api/ready<br>Admin Email: john.smith@example.com (mustChangePassword: true)<br>Admin Password : Stored in Secret Manager: toktickit-admin-password<br>(not printed).<br>cpe334test26@cloudshell:~/tokticki tw (ope33 oxitys [J<br><!-- End of picture text -->



#### **5.4 Turn off storage auto-increase right away** 

**Before you begin:** Step 5.3 finished. 

###### **Steps** 

1. Run: 

gcloud sql instances patch toktickit-pg --no-storage-auto-increase 

** Answer y if it asks you to confirm. 

**Why** : auto-increase is on by default, and a disk that has grown cannot shrink back. A fixed 10 GB disk keeps the cost predictable. 



#### **5.5 Test the running app.** 

**Before you begin:** You have the service URL. 

###### **Steps** 

1. Store the URL and call the health endpoints: 

export SERVICE_URL=$(gcloud run services describe toktickit --region "$REGION" --format='value(status.url)') echo "$SERVICE_URL" curl --fail "$SERVICE_URL/api/health" curl --fail "$SERVICE_URL/api/ready" 

<mark>/api/ready a</mark> nswers only when the app can reach the database. 



2. Run the smoke test from the kit: 

python3 deploy/smoke_test.py "$SERVICE_URL" 



<!-- Start of picture text -->
Pass<br>cpe334test26@cloudshell itt—w (ope334 tickit)$ 9}<br><!-- End of picture text -->

3. Open the URL in your browser. The login page must load from the public internet, without localhost and without a Google sign-in. 

#### **5.6 Get the first administrator password (privately)** 

**Before you begin: do not take a screenshot** for this step. 

###### **Steps** 

1. Read the generated password: 

gcloud secrets versions access latest --secret=toktickit-admin-password 

2. Sign in to the app as the administrator (the script prints the email at the end). The app makes you choose a new password at the first sign-in. Do it immediately. 

3. Never paste the password into a chat, a document, or an Issue. 



#### **5.7 Check in the Console what the script created.** 

**Before you begin:** The app works. Keep the Console open next to Cloud Shell. 

###### **Steps** 

1. Open each menu and compare with the table. In the Secret Manager page, **never click “View secret value."** 

|**What to**<br>**check**|**Menu**|**You should see**|
|---|---|---|
|Services|APIs & Services→<br>Enabled APIs & services|Cloud Run, Cloud SQL Admin, Artifact Registry, Cloud<br>Build, Secret Manager, IAM|
|Permissions|IAM & Admin→IAM|toktickit-runnerhas only**Cloud SQL Client**<br>(project-level)|
|Database|Cloud SQL→<br>toktickit-pg|PostgreSQL 16, databasetoktickit, storage<br>auto-increase off|
|Secrets|Security→Secret<br>Manager|The secret names only<br>(and under each secret's**Permissions**tab / Info<br>Panel,toktickit-runnerhas**Secret Manager**<br>**Secret Accessor**)|
|App settings|Cloud Run→<br>toktickit →Revisions<br>→Containers|NODE_ENVandTZas plain values;<br>DATABASE_URLfrom Secret Manager|



|**What to**<br>**check**|**Menu**|**You should see**|
|---|---|---|
|Scaling|Cloud Run→<br>toktickit|Minimum 0 instances, maximum 3|
|Image|Artifact Registry→<br>toktickit|The app image|



#### **5.8 Close the Issue** 

###### **Steps** 

1. In GitHub, comment on Issue #5 with the service URL and the screenshots from 5.5 and 5.7 (no secret values, no passwords). 

2. Move Issue #5 to _Done_ . 

#### **Done when** 

- The Cloud Run URL loads from the internet, and you can sign in. 

- /api/ready answers, which shows the app reaches the database. 

- The Cloud SQL instance, the database, the secrets, the runtime service account and the image all exist, and storage auto-increase is off. 

- No password or secret is in your screenshots, your Issue or your chat. 

**Note:** What “done” looks like depends on your project and the stack your team chose. The list above uses TokTickIT as the example. For your own app, “done” means your own service is reachable on a public URL, it reads its settings and secrets from the cloud and not from code, and its data is stored in a managed database and not in the container. 

#### **If something fails** 

|**What you see**|**What to check**|
|---|---|
|Billing or “free trial” error when<br>creating Cloud SQL|The trial must be active and billing enabled on this project<br>(Console→Billing)|
|“Permission denied” or “API not<br>enabled” right after enabling APIs|Wait one or two minutes and run the script again;<br>permissions can take a moment to apply|
|gcloud builds submitfails|Read the build log link it prints; the same build already passed<br>in CI, so check the project and region first|
|Script stops at the migration job|Read the job log with the command the script prints. Fix the<br>cause, then run the script again|



|**What you see**|**What to check**|
|---|---|
|The public URL answers<br>“Forbidden”|Your organization may block public access to Cloud Run. Use<br>the project of your own personal account, not a school or<br>company account|
|/api/readyfails but<br>/api/healthworks|The app cannot reach the database. Check the<br>DATABASE_URLsecret and the Cloud SQL connection on<br>the service|
|The first request after some idle|Minimum instances is 0, so Cloud Run starts a container on|
|time is slow|demand. This is expected|



#### **Official references** 

- <u>Deploy a container to Cloud Run</u> – what the last script step does 

- <u>Connect Cloud Run to Cloud SQL</u> – how the service reaches the database 

- <u>Use secrets in Cloud Run</u> – why the database URL and passwords are not in code 

- <u>Cloud Run container runtime contract –</u> PORT , environment variables, no data on the container’s disk 

#### **Helpful VS Code extensions** 

Install them on your own computer ( **Extensions** panel, Ctrl+Shift+X , search by name, and check the publisher). 

|**Extension**|**Publisher**|**Helps with**|
|---|---|---|
|GitHub Actions|GitHub|Editing workflow files such asdeploy.yml, and seeing<br>workflow runs in VS Code|
|YAML|Red Hat|Syntax checking fordeploy.ymland<br>docker-compose.yml|
|Docker (Container<br>Tools)|Microsoft|Dockerfileand Compose files, and your images and<br>containers|
|Google Cloud Code|Google<br>Cloud|Cloud Run and other Google Cloud tools inside the editor<br>(optional)|



###### **references** 

- <u>GitHub Actions for VS Code</u> 

- <u>YAML Language Support by Red Hat</u> 

- <u>Docker Extension Pack for Visual Studio Code</u> 

- <u>Google Cloud Code</u> 

### **Guide/Episode 6: Connect GitHub to GCP and set the merge gate** 

Videos: LEB2 / Learn It / Student Guide: GCP Deployment and CI/CD (Video) / Episode 6 Prerequisite: Episodes 4 and 5 Issue #6: (no branch for 6.1 to 6.4; a throwaway branch for 6.5) Criterion: CI and quality gate; also prepares the repeatable release pipeline 

###### **Goal** : 

1. Let GitHub Actions deploy to your Google Cloud project without any password or key file, using Workload Identity Federation, and only from your repository, your main branch and your deploy workflow. 

2. Make a failing check block merging into main, so a broken change can never be released. 

**No keys.** Never create or download a JSON key for a service account, and never put one in GitHub. The whole point of this episode is to avoid keys. 

**Adapt to your project.** This episode is about your GitHub repository and your Google Cloud project, so most of it is the same for every stack. Replace the names with your own: the repository, the project, the service account name, the environment name demo , the workflow file deploy.yml and the check name test-and-docker . Every name must match across GitHub, Google Cloud and deploy.yml . 

###### **Before you begin** 

- The first deploy from Episode 5 worked, and toktickit-runner , the Artifact Registry repository and the Cloud Run service exist. 

- ci-docker.yml and deploy/ are on main (Episode 4), and 

   - .github/workflows/deploy.yml is on main or ready to be added in Episode 7. 

- You have admin rights on the GitHub repository (Settings is visible). 

- You use Cloud Shell, signed in to the account that owns the project, for 6.2 and 6.3. 

- Keep your own numbers: **never copy another team’s repository ID, owner ID or project number.** 

#### **6.1 Find your repository IDs** 

**Before you begin:** You know your GitHub user or organization name and your repository name, exactly as they appear in the address of your repository. 

Google Cloud will accept deploys only from your repository. It identifies it by two numbers, not by name, because a name can be taken over by someone else after a repository is deleted. You need both numbers for 6.2 and 6.3. They are not secret, but they are different for every repository, so **never copy another team’s numbers** . 

###### **Steps** 

1. Open this address in your browser. Replace YOUR_GITHUB and YOUR_REPO : 

https://api.github.com/repos/YOUR_GITHUB/YOUR_REPO 

You see a page of text. Press **Ctrl+F** and find these two: 

- the first "id": near the top of the page is your **REPO_ID** ; 

- the "id": inside the block that starts with "owner": { is your **OWNER_ID** . 



<!-- Start of picture text -->
< G (@ hitps://api github.comv/repos/llbeumpbumpll/toktickt-webapp<br>lPretty-print<br>i<br>TOdELIG"? "R-KEDOVWKePg"<br>“name”: “toktickit-webapp",<br>“full_name": "1lbumpbump11/toktickit-webapp",<br>“private”: false,<br>"owner": {<br>Tode_ad"? "MDQGVXNIc jUxMTQyMjE2",<br>"avatar_url": "https: //avatars.githubusercontent.com/u/51142216?v=4",<br>"gravatar_id": "",<br>"url": "https: //api.github.com/users/1lbumpbump11",<br>“html_url": “https: //github.com/1lbumpbump11",<br>"followers_url": "https: //api.github.com/users/1lbumpbumpl1/followers",<br>"following url": "https: //api.github.com/users/1lbumpbump11/following{/other_user}",<br>“gists_url”: “https://api.github.com/users/1lbumpbumpll/gists{/gist_id}",<br>"starred_url": “https: //api.github.com/users/1lbumpbumpl1/starred{/owner}{/repo}",<br><!-- End of picture text -->

###### Write both numbers down. 

2. **If you see “Not Found”** your repository is private. Use one of these instead: 

   - Open your repository page on GitHub (signed in), press **Ctrl+U** to view the page source, and press **Ctrl+F** and search for octolytics-dimension . Read repository_id (this is your REPO_ID ) and user_id (this is your OWNER_ID when the repository belongs to your personal account). For an organization repository, open https://api.github.com/orgs/YOUR_ORG while signed in to read the organization id . 



<!-- Start of picture text -->
<meta name="octolytics-dimension-repository_id" content="1432526398"/>4<br><!-- End of picture text -->



<!-- Start of picture text -->
<meta name="octolytics-dimension-user_id" content="51142216"/><br><!-- End of picture text -->

- Or, if you have the GitHub CLI installed and signed in ( gh auth login ), run: 

gh api repos/YOUR_GITHUB/YOUR_REPO --jq '.id, .owner.id' 

The first number is `REPO_ID`, the second is `OWNER_ID`. 

3. **Check the token format (optional).** GitHub gives each repository a token format, called the OIDC subject, either with these IDs in it (immutable) or without. If you have gh , run: 

gh api repos/YOUR_GITHUB/YOUR_REPO/actions/oidc/customization/sub 

**Note whether use_immutable_subject is true or false . Without gh , skip this:** 

Use the format with IDs in 6.3, and only if the workflow in Episode 7 fails with “rejected by the attribute condition," switch to the format without IDs, as described in the table at the end of this episode. 



<!-- Start of picture text -->
PS C:\Users\CPE KMUTT\Documents\GitHub\toktickit-webapp> gh api repos/1lbunpbumpl1/toktickit -webapp/actions /oidc/customization/sub<br>use_default": true,<br>use_imutable_subject": true,<br>‘sub_claim prefix": “repo: 1lbumpbunp]1@51142216/toktickit-webapp@1432526398°<br><!-- End of picture text -->

#### **6.2 Create the deployer service account (Console).** 

**Before you begin:** You have your Project ID, and you know the name of the runtime service account from Episode 5 ( toktickit-runner ). 

**Names used in this step.** These depend on your project. Find your own values at the top of your deploy/deploy.sh , and use the same names everywhere in Episodes 6 to 8. 

|**What it is**|**Example (TokTickIT)**|**Your project**|
|---|---|---|
|**Deployer service account**: the<br>identity GitHub Actions uses to<br>deploy. You create it in this step,<br>so you choose the name|toktickit-deployer|YOUR_APP-deployer|
|**Runtime service account**: the<br>identity your running app uses. It<br>already exists from Episode 5<br>(SA_NAMEindeploy.sh)|toktickit-runner|the value ofSA_NAMEin<br>yourdeploy.sh|
|**Artifact Registry repository**:<br>where your images are stored. It<br>exists from Episode 5<br>(REPO_NAMEindeploy.sh)|toktickit|the value ofREPO_NAMEin<br>yourdeploy.sh|
|**Role for deploying**: what the<br>deployer may change. It depends<br>on where your app runs|Cloud Run Developer (the<br>app and its migration job run<br>on Cloud Run)|Cloud Run Developer if you<br>also use Cloud Run. If you<br>deploy somewhere else, ask<br>your lecturer which role fits|



The deployer’s name must be the same in 6.3, in the GitHub variable WIF_SERVICE_ACCOUNT (6.4) and in deploy.yml . 

###### **Steps** 

1. Open the Google Cloud Console and select your project. Go to **APIs & Services → Library** , 



<!-- Start of picture text -->
X Google Cloud<br>=a Solutions ><br>© _ Recently visited ><br>Favorite products<br>Favorite products appear here<br>Products<br>Billing og<br>@ AME Admin vw ><br>YW Marketplace og<br>i APIs & Services Bg > Enabled APIs & services<br>> Agent Platform w > <—<br>{e_ Compute Engine wy > Credentials<br>OAuth consent screen<br><!-- End of picture text -->

2. search for **IAM Service Account Credentials API** and click **Enable** . 



<!-- Start of picture text -->
= Google Cloud _(  crezoa6 Toni a+<br>ter API Library fa en neros coors coon x<br>= Filter Typeto filter 2 results<br>Visibitty ~1@<br>bie @ | serviceacount credo 21 | enyaAccess Mangaent CAM)<br>category a<br>Cooge Entaise APs @) a ;<br><!-- End of picture text -->

**Note:** If the page shows **Manage** (or **API Enabled** ) instead of **Enable** , the API is already on for your project, and you do not need to do anything. Some APIs are turned on automatically when you use a service for the first time, and the deploy script in Episode 5 may have enabled them already. Move on to the next one. 

3. Do the same for **Security Token Service API** . 



<!-- Start of picture text -->
ft API Library © security<br>token service apt x<br>APIbrery > “security<br>token service ap”<br>@ VertexAl is now Gemini Enterprise Agent Platform. Read morein our announcementblog (2.<br>‘= Filter Typeto filter 2results<br>Visibtty a °<br>ube @) | securityGocal Enterprise Token Service API AM @ SensitiveGoogle Etre Data Protection (OLP)<br>Category a<br>pata 0<br>Machine lesming o<br>Security a<br>Seouty CommandCenter Services<br><!-- End of picture text -->



<!-- Start of picture text -->
€ Product details<br>Security Token Service API<br>Google Enterprise AP!<br>The Security Token Service exchanges Google or third-party credentials<br>fora short-lived access.<br>Overview Documentation _—Related Products<br><!-- End of picture text -->

4. Go to **IAM & Admin → Service Accounts → Create service account** . 



<!-- Start of picture text -->
X Google Cloud<br>= cows >| iy cee<br>HiEE solutionsCloud overview >=———=]<br>6 =I )_ PrvlegedAccess Manager<br>FavoriteFort products products appear here W Rolesiroador i d entityorce Federation<br>Prodits dent Feceation<br>Principat Access Soundary<br>wating * Managed Workiood denies<br>W wenece ‘organization Poi<br>| = Ales Senices we > settings<br>Maemo se > Labels<br><!-- End of picture text -->



<!-- Start of picture text -->
= Google Cloud (+ CPe324-2026 Token IAM Service Account Credentise AP XQ Search<br>IAMS Admin Service accounts<br>oc 8 ‘Asence account represents a Google Cloud sevice ident, sich as code running on Compute Engine VMs, App Engine app. systemsrunning outside<br>Rep A Organization pocies canbe used to secure service accounts and blackish service acount fests, suchas automatic IAM Grants kay creatonpond.<br>© Privieged Access Mana<br>5 Pot : "= Fter_Enterpropery name or valve<br>@ Wordoad deny Fede O Ema stews Name Deseripton Key Keycreationdate Aut<br>Acres sa s0s2sts20007 @érabied —_Detat No soul<br>WH Mereond Werioediie= 1 O Brovickameccpe: @kndied Tobit No neq<br>B OrgenzstionPolces secon<br>© Aeset inventory 1<br>& Setings<br>© Labels<br>> Too 5<br><!-- End of picture text -->

5. Enter the deployer name, for example toktickit-deployer (yours: YOUR_APP-deployer ). Click **Create and continue** . 



<!-- Start of picture text -->
@ Create service account<br>Seniensocout ame<br>toktickit-deployer<br>toktickit-deployer x¢@<br>Email address: toktickit-deployer@cpe3<br>[lllciitiamagserviceaccounticom (8<br>Deploys from GitHub Actions to Cloud Run. No keys.<br>Describe what this sevice account wil do<br>Create and continue w<br><!-- End of picture text -->

6. In step 2, **Permissions (optional)** , click **Select a role** and choose **Cloud Run Developer** . Click **Continue** . Leave step 3, **Principals with access (optional)** , empty and click **Done** . 



<!-- Start of picture text -->
@ Permissions (optional)<br>Grant<br>this service account access to CPE334-2026 ToktickIT so that it has<br>ppermission to complete specific actions on the resources in your project.<br>Learn more<br>RoteCloud ud RunRun DeveloperDeveloper . JAM+ conditionAdd IAM(optiona)condition @ .<br>ReadRun resourcesand write access to all Cloud<br>+ Add another role<br>44 Help me choose roles<br><!-- End of picture text -->





<!-- Start of picture text -->
Service accounts + Create service account C Refresh<br>Service accounts for project "CPE334-2026 ToktickiT"<br>service account represents<br>accounts. 3 a Google Cloud service identity, such as code running on Compute Engine VMs, App Engine apps, or systems runningof<br>Organization policies can be used to secure service accounts and block risky service account features, such as automatic IAM Grants, key creation/ud<br>accounts entirely, Learn more about service account organization policies. 2<br>Filter<br>Enter property nameor value<br>OC Email Status Name Description KeyID _ Keycreation date<br>(23. 906251530807- @Enabled Default No<br>compute @developergserviceaccount.com compute keys<br>account<br>O  Stortickitrunner@cpe3 i Enabled —_TokTickiT No<br>[ll cittiomgserviceaccountcom Cloud Run keys<br>Service<br>OC  Btowtickit-deployer@cpe3 iN @Enabled —_toktickit- Deploys from No<br>PEI Kitiamgserviceaccounticom deployer GitHub Actions. keys<br>to Cloud Run, No<br>keys<br><!-- End of picture text -->

7. Give it permission to push images to **your repository only** : go to **Artifact Registry → Repositories** . Tick the row of your repository (for example toktickit ). If the panel on the right is not shown, click **Show Info Panel** in the menu bar. On the **Permissions** tab, click **Add Principal** , enter the email of the deployer account, choose the role **Artifact Registry Writer** , and click **Save** .  See Google’s steps: Access control with IAM – granting repository-specific rol 



<!-- Start of picture text -->
(3) AnitactRegisty Repositories EACrstorpostory Rash<br>% eoostries<br>8 setings _ Turon vulnerability scanning<br>QV) vourrcisty's ntbens mentee tron wineries Goose Cotes stmac winery rontenng fal rages pusher ples wth<br>Sf Setaconetozs perenne<br>epostImogenere usedtoan opetng strand oemmanage pata our bd artats sucha Docker<br>Sey<br><!-- End of picture text -->



<!-- Start of picture text -->
(2) AcitactRegistyy Repositories cnsterpoitny Charan Sta<br>© sige ‘Turn on vulnerability scanning x<br>OP STR tetetera<br>ret tome tm csen Sergei) © tert Labo eronpley © retin ©<br><!-- End of picture text -->



<!-- Start of picture text -->
X resource selected 7 Esitrepository Delete Setupinstructions §— @ 7<br>Turn on vulnerability scanning<br>S ‘Your registrydays at a costisnot being of $0.26 per monitoredimage.  for known vulnerabilities. Google Cloud offers automatic vulnerability monitoring of allmages pushed or pull<br>Turnen | Learn more<br>Repositories are used to store and manage your build artifacts, such as Docker<br>images, anguage and operating system packages.<br>= Fiter_ Enter property name or value<br>Nome Format Type Location Scanning (Disabled) ® Description Labels Version pote<br>(2 Mtoktickit —@ Docker Standard —_asia-southeast1 (Singapore) Disabled TokTickIT -<br>Permissions for 1 resource x<br>Edit or delete roles below.or select “Add principal’ to grant new access.<br>+2 Add principal<br>©&® Show inherited rol¥Nig table<br>Display roles inherited from Wrgparent resources in the table below<br>= Filter Enter property name or value (0)<br>Grant access to "toktickit"<br>Grant principals access to this resource and add roles to specify what actions the<br>principals<br>when a specificcan take.criteriaOptionally,is met. addLearn conditionsmore about to grant|AM  accessconditions to principals only<br>Resource<br>© toktickit<br>Add principals<br>Principalsprincipals arein AMusers, groups, domains, or service accounts. Learn more about<br>New principals *<br>toktickit-deployer@cpe3 x<br>tHE it.iam.gserviceaccount.com fo}<br>Assign roles x<br>Roles are composed of sets of permissions and determine what the principal can<br>do with this resource. Learn more<br>Toe<br>Artifact Registry Writer od<br>+ Add another role ®<br>"3<br>ones<br><!-- End of picture text -->

8. Let it run the app as the runtime account, on that account only: go to **IAM & Admin → Service Accounts** , click the runtime account (for example toktickit-runner ), open the **Principals with access** tab, click **Grant access** , enter the email of the deployer account, choose the role **Service Account User** , and **Save** . 



<!-- Start of picture text -->
[Google Cloud & Ciezt2e Tat aaierRepsr A seecr +#5H0:6<br>muses . Service accounts for project *CPE334-2026 ToktickiT”<br>— O au a ee a<br><!-- End of picture text -->



<!-- Start of picture text -->
Principals with access to this service account<br>include Google provided rote grants@<br>View roles<br>Vw by principals J.<br><!-- End of picture text -->

What each role allows: 

- **Cloud Run Developer** updates the Cloud Run service and the migration job. 

- **Artifact Registry Writer** on your repository only pushes the image. 

- **Service Account User** on the runtime account lets the deployed app run as toktickit-runner . The deployer cannot read secrets, manage IAM or create databases. 

#### **6.3 Create Workload Identity Federation (Console)** 

**Before you begin:** You have REPO_ID and OWNER_ID from 6.1, and you know whether use_immutable_subject is true or false. Open a text editor (Notepad) for the next step. 

###### **Steps** 

1. **Prepare the condition in a text editor first.** Paste this text, then Replace REPO_ID , OWNER_ID , YOUR_GITHUB , YOUR_REPO and ENV_NAME with your own values. Use demo for ENV_NAME unless you have a reason to choose another name (see the note below). Do not leave spaces before or after the values, and keep every single quote. 

assertion.repository_id == <mark>'REPO_ID'</mark> && assertion.repository_owner_id == <mark>'OWNER_ID'</mark> && assertion.ref == 'refs/heads/main' && assertion.workflow_ref == <mark>'YOUR_GITHUB/YOUR_REPO/</mark> .github/workflows/deploy.yml@refs/heads/main' && assertion.sub == 'repo <mark>:YOUR_GITHUB@OWNER_ID/YOUR_REPO@REPO_ID:</mark> environment <mark>:ENV_NAME'</mark> 

** If use_immutable_subject was **false** , the last part is assertion.sub == 'repo:YOUR_GITHUB/YOUR_REPO:environment:ENV_NAME'. Read it twice: it must show **your** values. 

**The environment name is part of this condition.** The end of the last line, :environment:ENV_NAME , is the name of the GitHub environment you will create in step 6.4. The names must be exactly the same, including capital letters. If you choose another name in 6.4, change it here too, and change the environment: line in .github/workflows/deploy.yml . If one of the three differs, the deploy workflow cannot sign in to Google Cloud and fails with “rejected by the attribute condition”. 

Example (TokTickIT): ENV_NAME is demo, so the line ends with environment:demo'. 

assertion.repository_id == '1432526398' && assertion.repository_owner_id == '51142216' && assertion.ref == 'refs/heads/main' && assertion.workflow_ref == 'llbumpbumpll/toktickit-webapp/.github/workflows/deploy.yml@refs/heads/main' && assertion.sub == 'repo:llbumpbumpll@51142216/toktickit-webapp@1432526398:environment:demo' 

2. Go to **IAM & Admin → Workload Identity Federation** 



<!-- Start of picture text -->
X Google Cloud<br>coud > Aenty cess<br>aM<br>fi} Coudoveniow ><br>5 Soutions > Groups<br>© recent voted > PrivilegedAccess Manager<br>Fovorite products W rkloadR o les  identity Federation<br>Favorite products appear here Wertorcedantiy Federation<br>Products<br>Principal Access Boundary<br>Biting * Managed Workoad dentiies<br>© wMeAdmin Fr > | esource Management<br><!-- End of picture text -->

- **If you have never created a pool in this project** , the page shows an introduction with four steps. Click **Get started** . 

- **If your project already has a pool** , the page shows a list instead. Click **Create pool** . 



<!-- Start of picture text -->
Workload Identity Pools<br>Workload‘Account keys.IdentityThere allows are4your stepsworkloads to settingto up access a workloadGoogle identi. Cloud without Service .<br>1. Create<br>a workload identity pool °<br>‘Theaccesspoolto identitiesorganizes and inthemanages pool  extemal identities. IAM lets you grant <><br>2. Connect<br>Add eitheran identity AWS or providerOpenID Connect (OIDC) providers to your pool. 4 s KA<br>3. Configure provider mapping<br>Set attributes and claims from providers to show up in IAM.<br>4. Grant access<br>Use a service account to allow pool identities to access resources in Google<br>Cloud<br><!-- End of picture text -->

3. Under **Create an identity pool** , enter the name github-actions . Check that the **Pool ID** below it also says github-actions (click **Edit** to change it; the ID cannot be changed later). Leave **Enabled pool** on. Click **Continue** . 



<!-- Start of picture text -->
@ Create an identity pool<br>Use pools to organize and manage external identities. Create a pool for each<br>environment that needs access to Google Cloud resources. Learn more. 4<br>) Pool IDs are used as identifiers in |AM and cannot be changed<br>later.<br>Name *<br>github-actions<br>Pool De<br>github-actions<br>Pool ID can have lowercase letters, digits, or hyphens, and must be at least 4<br>characters long.<br>Description ,<br>GitHub Actions deploys for TokTickIT<br>Appears when granting access to pool identities.<br>GY Enabled pool @<br>| Continue <¢<br><!-- End of picture text -->

4. Under **Add a provider to pool** , check that **Select a provider** says **OpenID Connect (OIDC)** . Enter the **Provider name** github-main . Check that the **Provider ID** below it also says github-main (click **Edit** to change it; it cannot be changed later). 

5. Set **Issuer (URL)** to https://token.actions.githubusercontent.com/ . Leave **JWK file (JSON)** empty. Under **Audiences** , keep **Default audience** . Scroll down and click 

**Continue** . 



<!-- Start of picture text -->
@ Adda provider to pool<br>ProvidersLearn more. manage 4 and verify identities. You can add more providers later. "4<br>Select a provider *<br>OpenID Connect (OIDC) v<br>Provider details v4<br>Provider name *<br>github-main<br>Provider 1D * e<br>github-main<br>Provider ID can have lowercase letters, digits, or hyphens, and must be at least 4<br>characters long. "3<br>Issuer (URL) *<br>https://token.actions.githubusercontent.com/<br>Issuer URL must start with https://<br>JWK file (JSON) Browse<br>Optional, only needed if issuer is not publicly accessiable. The JWK file should<br>comply with JWK specification. (4 The max size of acceptable file is 80kB.<br>Audiences<br>Acceptable values for the aud field in the OIDC token.<br>‘© Default audience<br>If the allowed audiences list is empty, the OIDC token audience must be<br>equal to the full canonical resource name of the<br>WorkloadidentityPoolProvider, with or without the HTTPS prefix.<br>https://iam.googleapis.com/projects/906251 530807/locations/global/<br>workloadidentityPools/github-actions/providers/github-main<br>CO Allowed audiencesa<br><!-- End of picture text -->

6. Under **Configure provider attributes** , the first row is google.subject . Enter assertion.sub in the box next to it. Click **+ Add mapping** and add a second row: attribute.repository_id on the left, assertion.repository_id on the right. 



<!-- Start of picture text -->
© Configure provider attributes<br>Credentials can include attributes that provide information about an identit<br>You can use attribute mapping to grant access to a subset of identities.<br>Learn more. 4<br>Google 1 - o1be1 *<br>° assertion.sub<br>Supported keys: |ee4 ° |<br>"google.subject’, Value must be a CEL<br>"google.groups’, expression,<br>“attribute.custom_attribute" [4 for example,<br>- Google 2 * ———_______" v4- o10¢assertion2 * ——________ sub’ 4<br>attribute.repository_idSupported keys: @ agsertion.repository_id4 ® |<br>"google.subject’, Value must be a CEL<br>"google.groups’, expression,<br>“attribute.custom_attribute" assertion sub’[2 for example,<br>[ + Add mapping<br><!-- End of picture text -->

7. Under **Attribute conditions** , click **Add condition** , paste the condition you prepared in step 1, and click **Save** . 



<!-- Start of picture text -->
A Hide mapping<br>Attribute conditions<br>Restrict authentication to a subset of identities. By default, all identities<br>\ belongingCondition to providersCEL in this pool can authenticate. Learn more. 2<br>assettion.repository. id == SET <5.<br>assertion.repository_owner,id == EEE && assertion.ref == “4<br>Usea CEL expression, 4 for example,* ‘admins’ in google. groups’<br>soc<br><!-- End of picture text -->

8. Give the deployer account access through the pool: on the **Workload Identity Pools** page click **Grant access** . Choose **Grant access using Service Account impersonation** . 



<!-- Start of picture text -->
fity Pools 7 Werkdoad entity Pook github-actions<br>B —_€_ github-actions poo! details Add provider B Delete poo!<br>github-actions |<br>4 v Ihour 6hours 12hours Iday 2days 4days 7days 14days 30days Custom ~ ' Fitter Enter propertyname or value<br>[ Displayname@® Type Status<br>I Workload Identity Federation usage Be «i githubmain owe @<br>i &. Nodata is availablefor the selected time frame.<br>1D github-actions |<br><!-- End of picture text -->



<!-- Start of picture text -->
Grant access<br>Grant access to your workload pools using federated identities or service account<br>impersonation. Federated identities only work with certain supported services.<br>© Grant access using federated identities (Recommended)<br>Download the Application Default Credential (ADC) file and make it availabe to your workload.<br>The file lets your workload access Cloud Client Libraries and Google API Client Libraries.<br>©@ Grant access using service account impersonation<br>This option allows your workload to impersonate a service account. After enabling the<br>connection, download the credential configuration file and make it availabe to your workloads<br>and client libraries,<br>To access resources, pool identities must be granted access to a service account<br>Once added, these identities will have permission to access any Google Cloud<br>services that the service account can access. Learn more. 2<br><!-- End of picture text -->

9. Select toktickit-deployer in the **Service accounts** list, choose **Only identities** 

**matching the filter** , set **Attribute name** to repository_id and **Attribute value** to your 

REPO_ID . Click **Save** , then **Dismiss** . 



<!-- Start of picture text -->
Select service account<br>Principals will have the same resource permissions as this service accounts<br>| tokt ckit-deployerServ i ce account “e~ aa<br>x principals (identities that can access the service account)<br>repository_idAttribute name. + | |1432526398 |<br>Limitedprovidertoattributethe keywordsmappingfrom Attribute value. ~~Learn more. 2<br><!-- End of picture text -->



<!-- Start of picture text -->
Configure<br>your application<br>fo Tsedata or credential. doce requite fers secure hint storage and instructions ast doesnt to contain elent brerles senstve on<br>hawt 1oretleve local redetalaendexchange them for Goon Cloud<br>short ved credentials,<br>Teoconnect o Google Cloud APIs rom your application ilin the ds below to<br>customizeGoogle Cidthe clientle, downoadibvaries, itLeaset anmoreenvironmentabout contigrngvariabletheto pontlentoi.brary on thenuseAWS<br>OID, Azure and x509<br>github rain .<br>(1061 token path *<br>Tie nin ptr ocalsrerio gt ODE akon<br>textfee yp -<br>he frat fe fe URL apes wee OC Woke eid fom<br>Dismiss<br><!-- End of picture text -->

10. Check the result. Open the provider and read the attribute condition again: it must show your repository ID, owner ID, main , deploy.yml and environment:demo . 



<!-- Start of picture text -->
€ github-actions<br>pooldetails _-LAddprovier J.Grantaccss_ Oca po! NY<br>oithub-actions seer<br>v Thour 6hours 12hours tday 2days 4days 7days 14days 30days antCustom . oe Yo cn‘inoadet pantCntr cn=nodourand rketwoodote eae polyoura<br>Workload identity Federation usage ea peoeeel eteee e eS<br>—_ ~ Download config<br>(Noda never see te fae<br>Toccrsresouces pool ees mute rred acest toa<br>ce ; terestennenetorr errary cogOneClee bed enetsa rere ave peasancan cet. ©<br>. —— | tierce<br>Desrion ec tie<br>Sue Ch@W craiesActon ely fr Tork Serdcssccount —y/ Cen rary conte<br>abril © UoetalwotonddentyPolrnp iam oneal con/ ret/0625 S07 can —— £ Donon x<br>gt<br><!-- End of picture text -->

11. Then go to **IAM & Admin → Service Accounts → toktickit-deployer → Keys** : the list must be **empty** . Never click **Add key** . 



<!-- Start of picture text -->
€ _ toktickit-deployer A<br>betas Pemisions Kes eties Logs ills<br>wth acess<br>Keys<br>‘a__ferden acco cuk pom vcr fk compromised ie conmendye wold doen sec coin aye wed ie Wed ny aden<br>1 nner sb thebn auton so scans enGooge Coase<br>(9 SeesSze sanotcaty abi sri sxe dete pi repostore Yuan astonish ah i te on sveatcountpeseesprs’<br>tacoma lr upd pub aycart rm ting yak<br>Block serve account ay ron ug onnztn pole<br>tae mas wen npn ples rtovoraeeaa 4<br>they=<br>TypeNoro toySahn Key_Cretinhta pone<br><!-- End of picture text -->

#### **6.4 Configure GitHub: environment and variables** 

**Before you begin:** 6.3 is done. You have the Project ID, the region from Episode 5, the **Project number** , and the names of your deployer service account, pool and provider. 

**Names used in this step.** Most of these depend on your project and must match what you created earlier. 

|**What it is**|**Example (TokTickIT)**|**Your project**|
|---|---|---|
|**Environment name.**Enterdemo. This<br>name is used in three places and must be<br>exactly the same in all of them:<br>1. the GitHub environment you<br>create here;<br>2. the lineenvironment: demo<br>in<br>.github/workflows/deplo<br>y.yml;<br>3. the end of the condition in step<br>6.3<br>(...:environment:demo).|demo|demo(keep it; if you<br>change it, change all<br>three places)<br>We recommend you<br>keepdemo, because the<br>Starter Kit uses it. If you<br>choose another name,<br>change it in all three<br>places. If one of them<br>differs, the deploy<br>workflow cannot sign in<br>to Google Cloud.|
|**GCP_PROJECT_ID**: your Google Cloud<br>Project ID (not the project name)|cpe334-team07|your Project ID|
|**GCP_REGION**: the region you used in<br>Episode 5|asia-southeast1|your region|
|**WIF_PROVIDER**: the full name of the<br>provider from 6.3|projects/12345678<br>9012/locations/gl<br>obal/workloadIden<br>tityPools/github-<br>actions/providers<br>/github-main|Replace<br>123456789012with<br>your**Project number**;<br>keep the pool and<br>provider names you<br>chose in 6.3|
|**WIF_SERVICE_ACCOUNT**: the email of<br>the deployer from 6.2|toktickit-deploye<br>r@cpe334-team07.i<br>am.gserviceaccoun<br>t.com|YOUR_APP-deployer<br>@YOUR_PROJECT_ID.<br>iam.gserviceaccou<br>nt.com|



****Where to find your Project number:** in the Console, open the **Dashboard** and look at **Project info → Project number** . It is a number, different from the Project ID. 

**Do not rename the four variable names** : deploy.yml reads exactly these names. 

###### **Steps** 

1. In GitHub, open your repository, then **Settings → Environments → New environment** . Enter demo and click **Configure environment** . 

**Environment name.** The name demo is the one used in the Starter Kit’s deploy.yml , and we recommend you keep it. If you choose another name, it must be exactly the same in three places: the GitHub environment (here), the line environment: in .github/workflows/deploy.yml , and the end of the assertion.sub condition in step 6.3 ( ...:environment:ENV_NAME ). If one of them differs, the deploy workflow cannot sign in to Google Cloud. 



<!-- Start of picture text -->
© tsues3 Pulvequsts G2 Agents © Actions (E Projects 1 wie © Securityandquay Insights<br>© cenerl Environments<br><!-- End of picture text -->



<!-- Start of picture text -->
Environments / Add<br>= SS—_—<br><!-- End of picture text -->



2. Under **Deployment branches and tags** , choose **Selected branches and tags** , click **Add deployment branch or tag rule** , enter main and save. Now only main can deploy to this environment. 



<!-- Start of picture text -->
Deployment branches and tags<br>Y No restition<br>context. Deployment limited to branches with protection rules.<br>Sa eos<br>‘Add environment secret<br><!-- End of picture text -->



<!-- Start of picture text -->
Deployment branches and tags ‘Selected branches and tags ~<br>No branch or tag rules applied yet: all branches and tags are still allowed to deploy.<br>@ Add deployment branchor tag rule a<br><!-- End of picture text -->



<!-- Start of picture text -->
———————————— |<br>Add deployment branch or tag rule x<br>Ref type: Branch +<br>Name pattern:<br>LE<br>Add rule<br>ee ><br><!-- End of picture text -->



<!-- Start of picture text -->
Deployment branches and tags Selected branches and tags ~<br>1 branch and 0 tags allowed<br>=n<br>Cent appliesto 1 branch | Et) | Remove<br><!-- End of picture text -->

3. Under **Environment variables** , click **Add environment variable** and add the four variables from the table. They are **variables** , not secrets: they say where to deploy and are not passwords. Do not create any secret in this episode. 



<!-- Start of picture text -->
Environment variables ‘Add environment variable<br>Variables are used for non-senstive configuration data. They are accessible only by GitHub Actions inthe context of this environment by using the<br>Name 21 value Last updated<br><!-- End of picture text -->



<!-- Start of picture text -->
‘Add variable x<br>Name J<br>Value J<br>@<br><!-- End of picture text -->

|**Name**|**Value**|
|---|---|
|GCP_PROJECT_ID|your Project ID|
|GCP_REGION|your region, for exampleasia-southeast1|
|WIF_PROVIDER|projects/PROJECT_NO/locations/global/workloa<br>dIdentityPools/github-actions/providers/gith<br>ub-main|
|WIF_SERVICE_ACCOUNT|YOUR_APP-deployer@YOUR_PROJECT_ID.iam.gservi<br>ceaccount.com|





<!-- Start of picture text -->
Environment variables ‘Add environment variable<br>Name 2 Value Last updated<br>8 cor rmrecr 0 a emnteso 2 0<br>B cer nec100 asie-southeast! Tmintesago OO<br>8 wir mois scl coniscosinoninae. Annee 28<br>& wae service sccou okt ceplver cp cetiamgsevic. CS minuesago FO<br><!-- End of picture text -->

4. Check the result: the environment lists the four names with their values, and the deployment rule shows main . 

For more detail, see GitHub’s guide to managing environments for deployment 

#### **6.5 Protect main with a ruleset (the merge gate)** 

**Before you begin:** 

- The CI workflow from Episode 4 has run at least once in your repository (the check name only appears in the list after a run). 

- Step 6.4 is finished: environment demo is restricted to main and has its four variables. 

- You are an admin of the repository. 

**Why we do this:** the pipeline deploys whatever reaches main . A ruleset makes sure nothing reaches main unless a pull request passes the CI check. This is the “quality gate” part of the rubric. 

###### **What depends on your project?** 

|**What it is**|**Example (TokTickIT)**|**Your project**|
|---|---|---|
|Name of the CI check that must pass|test-and-docker|The job name in your own|
|(the job name in your CI workflow)||workflow file|
|Number of required approvals|1(team),0(working alone)|Your team size|



###### **Steps** 

1. Open **Settings → Rulesets → New ruleset → New branch ruleset** . 



<!-- Start of picture text -->
Owens | oeiaiewebpp - \ Sedona<br>Code © Issues 3 11 Pullrequests G2 Agents © Actions (F Projects 1) wiki © Security and quality [x Insights Settings<br>® General Rulesets<br>D Moderation v " Learn m<br>“G Rulesets a New branch ruleset Xf<br>Branches Import a ruleset<br>© Tags<br>& Webhooks<br>®B Copilot v<br><!-- End of picture text -->

2. **Ruleset Name:** protect-main . 

3. **Enforcement status:** change _Disabled_ to **Active** . A ruleset left on Disabled does nothing. 

4. **Bypass list:** leave it empty. Do not add yourself or any role. If someone can bypass, the gate proves nothing. 



<!-- Start of picture text -->
Rules /New branchlee<br>@ rote your most important branches<br>era<br>bypass tis empty<br><!-- End of picture text -->

5. **Target branches:** click **Add target → Include default branch** (or _Include by pattern_ with main ). 



<!-- Start of picture text -->
Target branches<br>Branch targeting criteria ‘Add target ~<br>© inde defet branch A<br>Branch targeting has not been con. © includeallbranches<br><!-- End of picture text -->

6. In **Rules** , tick: 

   - **Restrict deletions** (on by default) 

   - **Block force pushes** (on by default) 

   - **Require a pull request before merging** , with **Required approvals** set to 1 . If you work alone, set it to 0 : you cannot approve your own pull request, and with an empty bypass list you would not be able to merge. 

   - **Require status checks to pass** , then tick **Require branches to be up to date before merging** , then click **Add checks** and select your CI job ( test-and-docker for TokTickIT). Typing the name is not enough; you must pick it from the list. 

   - Leave the other boxes as they are. 



<!-- Start of picture text -->
Require a pull request before merging<br>A Require all commits be made to a non-target branch and submitted va a pull request befor they can be merged.<br>Hide additional settings<br>Required approvals<br>Gj<br>|) Dismiss stale pull request approvals when new commits are pushed<br>New, reviewable commits pushed wil dismiss previous pul request review approvals<br>() Require review from specific teams<br>‘collection of reviewers and associated fle pattems. Each reviewer has alist of file patterns which determine the files that reviewer is required to review.<br>() Require review from Code Owners<br>Require an approving review in pull equests that modi files that havea designated code owner.<br>() Require approval of the most recent reviewable push<br>Whether the most recent reviewable push must be approved by someone other than the person who pushed it<br>() Require conversation resolution before merging<br>All conversationson code must be resolved before a pull request can be merged.<br>Require an additional approval for unattributed Copilot pull requests (Preview)<br>Allowed merge methods<br>Merge, Squash, Rebase ~<br>When merging<br>pull requests, you can allow any combination of merge commits, squashing, or rebasing. At east one option must be enabled.<br><!-- End of picture text -->



<!-- Start of picture text -->
Require status checks to pass<br>Choose<br>which status checks must pass before the ref is updated. When enabled, commits must frst be pushed to another ref where the checks pas.<br>Hide additional settings<br>Require branches to be up to date before merging<br>Whether pull request targeting a matching branch must be tested withthe latest code, Ths setting wil not take effect unless atleast one status checks<br>enabled<br>(J Do not require status checks on creation<br>Required status checks + Add checks ~<br>‘Add Checks<br>No checks have been added testest<br>Learn more about status checks ‘Group newEntries<br>C] + Add test Any source<br>@ Block force pushes suggestions J<br>Prevent users with push acces from force pushing to refs \) test-and-docker Git Actions<br><!-- End of picture text -->



<!-- Start of picture text -->
Rulesets/ protect-main (etve) 7<br>Rulest created x<br>Ruleset Name*<br>protect-main<br>Enforcement status<br>© Active ~<br><!-- End of picture text -->

7. Scroll to the bottom and click **Create** 

#### **6.6 Prove the gate works** 

**Before you begin:** The ruleset protect-main is Active (6.5). Your CI workflow also runs on pull requests into main (Episode 4). You can run your tests locally and know where they live. 

**Why we do this:** a rule you have never seen block anything is only a guess. Here you break a test on purpose, open a pull request into main , and watch GitHub refuse to merge it. The screenshot of this refusal is your evidence for the quality-gate criterion. 

###### **What depends on your project?** 

|**What it is**|**Example (TokTickIT)**|**Your project**|
|---|---|---|
|A test you can break|One existing test in the server tests:|Any existing test in your stack (Jest,|
|safely|change the expected value|Vitest, pytest, JUnit, and so on)|
|The command that|The one CI uses (npm test)|Your own test command|
|runs your tests|||



###### **Steps** 

1. Create a throwaway branch from main: test/prove-gate 

2. Break one test on purpose, for example change an expected value so the assertion is wrong. Run your test command locally and confirm it fails. 

3. Commit and push the branch 

4. On GitHub, open a pull request with **base: main** and **compare: test/prove-gate** . Open it as a normal pull request, not a draft. 



<!-- Start of picture text -->
Open a pull request<br><!-- End of picture text -->

5. Wait for CI. The check test-and-docker turns red. 

6. Scroll to the merge box at the bottom of the conversation. The merge button must be blocked, with a message saying required checks have not passed. 



<!-- Start of picture text -->
PCED llbumpbumpll wants to merge1 commit into main from test/prove-gate (O)<br>© Conversation © -& Commits 1 Checks 1 Files changed 1<br>Hbumpbumpll commented in1 minute owner +++<br>Intentionally breaks one assertion in. server/tests/1ab-O1/health.test.ts to confirm the test-and-docker check goes red<br>and blocks merging. Do not merge; close after verifying.<br>(2)<br>-& GAD cost: break a test on purpose to prove the merge gate X eaifisa<br>3 | tx) Review required<br>At least 1 approving review is required by reviewers with write access<br>tx) All1 failing checkscheck have failed v<br>© & © & Docker Build / test-and-docker (pull_request) Failing after 365 wee<br>a) Merging is blocked<br>Atleast 1 approving review is required by reviewers with write access.<br>Merge pull request» You can also merge this withthe command line, View commandline instuctions,<br>Still in progress? Convert to draft<br><!-- End of picture text -->

7. **Do not merge.** Click **Close pull request** , then delete the branch ( **Delete branch** ). Also remove the local copy 

8. Optional second proof: on main , make any small change and try git push origin main . GitHub should reject it with a message about repository rule violations. Undo the local change afterwards. 

**Official references:** <u>Creating rulesets for a repository (GitHub Docs)</u> 

#### **6.7 Close the Issue** 

1. Comment on Issue #6 with the screenshots from 6.4 to 6.6 (no secrets, no project number). 

2. Move Issue #6 to _Done_ . 

#### **Done when** 

- The demo environment exists, only main can deploy to it, and it has the four variables. 

- The Workload Identity Federation provider exists and the deployer service account has **no keys** . 

- A Pull Request with a failing test cannot be merged: **Merge** is disabled and test-and-docker is marked Required. 

- No key file, password or secret is in GitHub, in your Issue or in your screenshots. 

**Note:** The names and the exact rules depend on your project and your team. The settings above use TokTickIT as the example. For your own project, “done” means GitHub can deploy to your Google Cloud project without keys, only from your repository and main , and a failing required check always blocks the merge. 

#### **If something fails** 

|**What you see**|**What to check**|
|---|---|
|“The given|Your condition does not match the token. Run:|
|credential is<br>rejected by the|echo "$WIF_CONDITION"|
|attribute<br>condition” when<br>the workflow signs<br>in|and compare with 6.3: repository ID, owner ID, themainbranch, the<br>deploy.ymlfile name, thedemoenvironment name, and the immutable<br>or older subject format|
|test-and-dock<br>ercannot be<br>chosen in the<br>ruleset|The check has not run yet, or its name is different. Open a Pull Request so it<br>runs, then add it again|
|The Merge button<br>is still enabled|The ruleset is not Active, the required check was ticked but not added, or<br>your account is in the bypass list|
|You cannot merge<br>your own Pull<br>Request even<br>when checks pass|Required approvals is 1 and you are the author. Ask a teammate to approve,<br>or set approvals to 0 if you work alone|
|The ruleset page<br>says it is not<br>enforced|Some GitHub plans do not enforce rulesets on a private repository. Read the<br>message on the page and ask your instructor|
|gh: command<br>not foundin<br>Cloud Shell|Run 6.1 on your own computer, or read the IDs from<br>https://api.github.com/repos/YOUR_GITHUB/YOUR_REPO<br>for a public repository|
|keys list<br>shows a key|Delete it withgcloud iam service-accounts keys deleteand<br>find out who created it. No key should exist|



#### **Official references** 

- <u>google-github-actions/auth</u> – Workload Identity Federation for GitHub Actions 

- <u>GitHub OIDC reference: immutable subject claims</u> – why the token has the IDs in it 

- <u>Managing environments for deployment – the</u> demo environment and its variables 

- <u>Creating rulesets for a repository – the merge gate</u> 

### **Guide/Episode 7: Auto deploy and smoke test** 

Videos: LEB2 / Learn It / Student Guide: GCP Deployment and CI/CD (Video) / Episode 7 

Prerequisite: Episode 4, 5, 6 

Issue #7: (branch `feature/auto-deploy` for 7.2 to 7.4: adapt names and add the deploy workflow; no branch for 7.5 and 7.6; a second branch `feature/deploy-proof` for 7.7) 

Criterion: Repeatable release pipeline, supports GCP deployment 

**Goal** : merging into main runs your tests, builds the image, runs the database migration, deploys to Cloud Run, and checks the public URL. Nobody types a deploy command. 

**Adapt to your project.** This episode is partly project-specific. The pipeline stages are the same for every project, but service names, image path, migration command and the endpoints checked by the smoke test depend on your project and tech stack. Each step marks what to change, with the TokTickIT value as an example. 

###### **Before you begin** 

- Episodes 4, 5 and 6 are finished. 

- The Cloud Run service toktickit , the job toktickit-migrate , the Artifact Registry repository and the Cloud SQL database exist (Episode 5). 

- The GitHub environment demo and the ruleset on main exist (Episode 6). 

- deploy.yml is in your working copy from the starter kit and is not on main yet. 

- CI also runs on pull requests into main (Episode 4). 

- Environment demo has its four variables (6.4). 

#### **7.1 Understand the workflow** 

The workflow is provided in the starter kit, so you do not write it yourself. It is the file .github/workflows/deploy.yml . The scripts it calls, deploy/release.sh and deploy/smoke_test.py , are also in the kit. If you used the kit in Episode 5, the two scripts are already in your repository. In 7.4 you copy deploy.yml into it and adapt names if needed. 

The workflow (name **Deploy demo** ) does this, in order: 

|**Stage**|**What happens**|**Why**|**Where it is defined**|
|---|---|---|---|
|test|Reuses the CI workflow<br>(ci-docker.yml)|Only tested code<br>can be released|deploy.ymlcalls<br>your Episode 4 file|
|Authenticate|Signs in to Google Cloud with<br>Workload Identity Federation (no<br>key)|Uses the setup<br>from Episode 6|deploy.yml|



|**Stage**|**What happens**|**Why**|**Where it is defined**|
|---|---|---|---|
|Build and push|Builds the rootDockerfileand<br>pushes it, tagged with the full<br>commit SHA|Every release is<br>traceable to one<br>commit.|deploy.yml|
|release.sh|Resolves the image digest, runs the<br>migration job, updates the Cloud Run<br>service|Database and app<br>change together|deploy/releas<br>e.sh|
|Smoke test|deploy/smoke_test.pychecks<br>the public URL|Proves the release<br>really works|deploy/smoke_<br>test.py|
|Record|Writes the image tag, digest and URL<br>to the run summary|Evidence for your<br>report|deploy.yml|



###### **Steps** 

1. Open the starter kit and read .github/workflows/deploy.yml once. You do not need to change anything yet. 

2. Find the stages from the table in the file (look for test , Authenticate , Build and push image , Verify image, migrate and deploy , Smoke test public URL ). 

#### **7.2 Check the names against your project** 

The workflow uses names that must match the resources you created in Episode 5 and the GitHub environment from Episode 6. For TokTickIT they already match, so you only check. For another project, you note what to change and edit it in 7.4. 

|**What it is**|**Where it is set**|**Example (TokTickIT)**|**Your project**|
|---|---|---|---|
|Cloud Run<br>service name|SERVICE_NAMEindeploy.yml|toktickit|The name from<br>Episode 5|
|Migration job<br>name|MIGRATE_JOB_NAMEin<br>deploy.yml|toktickit-migr<br>ate|Your migration<br>job|
|Artifact Registry<br>repository and<br>image|.../toktickit/toktickit:<br>TAGindeploy.ymland<br>release.sh|repository<br>toktickit, image<br>toktickit|Your repository<br>and image|
|GitHub<br>environment|environment:indeploy.yml|demo|The<br>environment<br>name from 6.4|



|**What it is**|**Where it is set**|**Example (TokTickIT)**|**Your project**|
|---|---|---|---|
|URLs checked by|smoke_test.py|/api/health,|Endpoints of|
|the smoke test||/api/ready,/,<br>/api/categorie<br>s|your own app|
|Migration|The Cloud Run migration job|Prisma|Your own|
|command|(Episode 5)||migration tool|



Project, region and Google Cloud sign-in values are **not** in the files. They come from the environment variables you set in 6.4. 

###### **Steps** 

1. Open deploy.yml in the kit and find each setting in the table. 

2. Open the Cloud Run console and Artifact Registry and compare the names with what you created in Episode 5. 

3. Write down any name that differs. You will change it in 7.4, step 6. 

**Done when:** every name in the table matches your Google Cloud resources and your GitHub environment, or you have a list of the ones to change. (This depends on your project and tech stack.) 

#### **7.3 Optional: smoke test login** 

The smoke test always checks health, database readiness, the home page and categories. It can also check that a user can sign in, read their profile and sign out. This is optional. Do it **before** the release in 7.4, otherwise the first deployment skips the login check. 

###### **What depends on your project?** 

|**What it is**|**Example (TokTickIT)**|**Your project**|
|---|---|---|
|Endpoints the login check calls<br>(insmoke_test.py)|/api/auth/login,<br>/api/auth/me,<br>/api/auth/logout|Your own sign-in endpoints;<br>edit the script if they differ|
|Test account|A Requester account you create<br>in the app|Any low-privilege account of<br>your app|



###### **Before you begin** 

- Your deployed app has a way to create a user (in TokTickIT the administrator can add users). 

- The account must be a dedicated test account with the lowest role. Do not use the administrator, and do not reuse the password of a real person or a demo account. 

###### **Steps** 

1. Create the test account in your deployed app with a strong password. If your app forces a password change at first sign-in, sign in once yourself and change it, so the smoke test can sign in directly. 

2. In GitHub open **Settings → Environments → demo** . 

3. Add the **environment variable** SMOKE_EMAIL with the account’s email. 

4. Add the **environment secret** SMOKE_PASSWORD with the password (under _Environment secrets_ , not variables). 

5. Set both or neither. With neither, the script prints SKIP login . 



<!-- Start of picture text -->
Environment secrets Add environment secret<br>Secretsare encrypted environment variables. They are accessible only by GitHub Actions in the context of this environment by using the secret<br>context.<br>Name Et Last updated<br> swoxe_passwoRD nw 2<br>Environment variables ‘Add environment variable<br>Variables are used for non-sensitive configuration data. They are accessible only by GitHub Actions in the context of this environment by using the<br>variable context<br>Name Et Value Last updated<br> ccr_provect_1o pe334-2026-toktickit (O Bhousago 2G<br>B ccr_recton asia-southeast!_ Bhousago 2<br>B swoxe_enare smoketest@examplecom thourago 2 OG<br><!-- End of picture text -->

Never put a password in the workflow file or in this guide. 

**Done when:** Either both values are set (and the smoke step later prints PASS login and authenticated /api/auth/me), or you choose to skip login and the step prints SKIP login. (The endpoints and the account depend on your project and tech stack.) 

#### **7.4 Add the workflow files and release to main** 

###### **Before you begin** 

- 7.2 is done (names checked), and 7.3 is done or skipped on purpose. Set the smoke test login first, because the first release already runs the smoke test. 

- Your working copy is clean ( git status shows nothing to commit). 

- You know where the starter kit is unzipped (called KIT below). 

- If a pull request from an earlier episode is still open (for example, the throwaway one from 6.6), close it without merging and delete its branch. 

###### **Steps** 

1. Update staging to match main . 

   - a. A release pull request merges staging into main 

   - b. This creates a merge commit on main , so staging falls behind. 

   - c. The ruleset requires up-to-date branches, so sync first. 

2. If git merge says “Already up to date," nothing is needed. 

3. Create the working branch: feature/auto-deploy (example) 

4. Copy **only the files you are missing** from the kit. Usually that is one file. 

5. Check with git ls-files deploy . If release.sh or smoke_test.py is missing, copy it from /deploy/ as well. 

   - a. **Do not copy ci-docker.yml or README.md .** Yours are customized (CI also runs on staging ), and the kit versions would overwrite them. 

6. Apply the name changes you noted in 7.2, in deploy.yml and also in deploy/release.sh and deploy/smoke_test.py where the same names appear, so all three agree. For TokTickIT, there is nothing to change. Then check, commit, and push. 

7. Open a pull request into staging with Part of #7 . Wait for green checks, then merge. 

8. Open the **release pull request** : base main , compare staging , with Part of #7 . Wait until test-and-docker is green, then merge. 

9. Merging pushes to main , which starts **Deploy demo** automatically. This step is also the first real test of your Episode 6 setup (sign-in to Google Cloud without a key). 



<!-- Start of picture text -->
© cisadd deploy workflow a<br>‘<br><!-- End of picture text -->

**Done when:** deploy.yml is on main (together with the deploy/ scripts) and a **Deploy demo** run appears in the Actions tab. (Whether the run is green is checked in 7.5.) 

#### **7.5 Watch the release.** 

###### **Before you begin** 

- The release pull request from 7.4 is merged into main . 

- Your app allows public access (Episode 5), so the URL opens without sign-in. 

###### **Steps** 

1. Open **Actions → Deploy demo → the latest run** . 

2. Wait for the jobs test and deploy to finish. The first run builds the whole image, so allow several minutes. 

3. Open the **Smoke test public URL** step. You should see lines like PASS /api/health , PASS /api/ready , PASS / , PASS /api/categories . If you set the login check in 7.3 you also see PASS login and authenticated /api/auth/me and PASS logout ; otherwise you see SKIP login . 



<!-- Start of picture text -->
> @ Build and push image 4s:<br>> @ Verify image. migrateand deploy sas<br>> @ Record deployment e:<br><!-- End of picture text -->

4. Open the run **Summary** and read **TokTickIT demo deployment** : the image tag (a full commit SHA), the digest, and the URL. 

5. Open the URL in a browser. The first request can take a few seconds because Cloud Run starts a new instance. 



<!-- Start of picture text -->
@ Merge pull request #15 from llbumpbumpll/staging #1 eum lobe<br><!-- End of picture text -->



<!-- Start of picture text -->
TokTickIT demo deployment<br><!-- End of picture text -->

#### **7.6 Check it in the Google Cloud Console** 

###### **Steps** 

1. **Revision history of your service:** open **Cloud Run** 

<u>( https://console.cloud.google.com/run/services</u> ), click your service, and open the **Revision history** tab. The newest revision must have 100% of the traffic. Select it and compare the container image digest in the details panel with the digest in the run summary. 



<!-- Start of picture text -->
a<br>TE wenn > | Sentes<br><!-- End of picture text -->



<!-- Start of picture text -->
—— Revisions & Manage wut © toktickit-00005-més.<br><!-- End of picture text -->

2. Open that revision and compare its container image digest with the digest in the run summary. They must be the same. 

3. **Cloud Run → Jobs → your migration job → Executions:** the latest execution must show success. 



<!-- Start of picture text -->
)> Cloud Run BS Jobs G1 Deploy containe<br>@ Carew ‘A job executes tasks to completion. Jobs are ideal for batch processing data<br>Ace 1 A tnen endmecineering wrote<br>Gp Worer poate on Sansotestencution Lastexecuted Region<br>Bh Domain mappings oct 7,2026,119649PM _asie-souteast<br><!-- End of picture text -->

4. **Artifact Registry → your repository → your image:** there is an image tagged with the same commit SHA as in the summary . 

   - a. There is an image tagged with the same commit SHA as in the run summary (Actions 

      - → Deploy demo → your run → Summary → “Commit image tag”). 



<!-- Start of picture text -->
© Merge pull request #17 from llbumpbumpll/staging #2 Renmaliote |O Lnen8 ==<br>@ Sernmary gone14 minstesa a ouison a<br>eo cara<br>———<br>TokTickIT demo deployment a<br>——<br><!-- End of picture text -->



<!-- Start of picture text -->
= GoogleCloud (t+ cPe334-2026 ToktickT Artifact Registry XQ Search<br>(a) Artifact Registry B —& Digestsfor toktickt B Setupinstructions © Copy path<br>Settings ' Turn on vulnerability scanning<br>© ‘YourVoreotecon registryis not being monitored for known vulnerabilities. Google Cloud offers automatic vulnerability monitoring of all imq<br>ots pe mae<br>| Hide 0c attermatve arifacts = Filter Enter property name or<br>tone bat Tae value WAraid Ui<br>O = @is3fdsooa700 — 3302a906d9206F430411999ed1 9173800340142 ‘hour ago hour ago<br><!-- End of picture text -->

**Done when:** the revision, the job execution, and the image all match the release you just made. (Console labels may differ slightly from this text; follow the meaning.) 

#### **7.7 Prove it is repeatable** 

###### **Before you begin** 

- 7.5 and 7.6 are done. 

- Your first release has put a merge commit on main , so staging is behind again. 

###### **Steps** 

1. Sync staging with main , as in 7.4 step 1. 

2. Create feature/deploy-proof from staging . 

3. Make a small visible change that users can see in the browser (for example a sentence on the home page). Run your tests locally. 

4. Commit, push, and open a pull request into staging with Part of #7 . Wait for green checks, then merge. 

5. Open the release pull request (base main , compare staging , Part of #7 ), wait for green checks, then merge. 

6. Watch **Deploy demo** start by itself and finish green. You type no deploy command. 

7. Reload the URL (hard refresh, Ctrl+F5 ) and look for your change. Also check that Cloud Run now has a second revision. 



<!-- Start of picture text -->
—<br>© Upcomingchange to Gitiub App installation token format<br>ee ae ve . —_ .<br>Deploy demo<br>€ Mere pul request #17 fom tbumpbumplstging<br>€ Mere pul request 15 fom Ibumpbumpltging<br><!-- End of picture text -->



<!-- Start of picture text -->
Sign in to your account<br>Eel address *<br>name@toktickit<br>com<br>Password*<br><!-- End of picture text -->

##### **Done when** 

- deploy.yml is on main , and a merge into main starts **Deploy demo** with no manual command. 

- The run is green, including the smoke test ( PASS lines for health, readiness, home page, and categories; login is PASS or SKIP ). 

- The image tag in the run summary equals the commit you merged, and the Cloud Run revision uses the same image digest. 

- The migration job execution succeeded, and the newest revision has 100% traffic. 

- A second release, started only by merging, shows your change on the public URL. 

- (The checks, names, and endpoints depend on your project and tech stack.) 

#### **If something fails** 

Open the failed run (Actions → Deploy demo), find the first red step, and use the matching row. 

|**Symptom**|**Likely cause**|**Fix**|
|---|---|---|
|Release pull request says<br>the branch is out of date|stagingis missing the last<br>merge commit ofmain|Mergeorigin/maininto<br>staging, push (7.4 step 1)|
|CI no longer runs on<br>stagingafter copying<br>from the kit|ci-docker.ymlwas<br>overwritten|Restore your Episode 4 version<br>(branches: [main,<br>staging])|
|No Deploy demo run after<br>the merge|deploy.ymlis not in<br>.github/workflows/on<br>main|Check the path onmain|
|Authentication: “rejected by<br>the attribute condition”|The 6.3 condition does not<br>match (environment name, IDs,<br>filename)|Compare with the 6.3<br>template; the environment<br>name must match everywhere|
|Validate deployment<br>settingsfails, or “Branch<br>is not allowed to deploy”|A variable in environmentdemo<br>is empty, or the run did not start<br>frommain|Check the four variables in 6.4;<br>run frommainonly|
|Push or deploy: permission<br>denied|A role is missing on the deployer<br>account|Re-check the roles from 6.2|
|Migration job fails|Database not reachable, secret<br>missing, or a migration error|Read the job execution logs in<br>Cloud Run|
|Smoke test fails|The app did not start, cannot<br>reach the database, or the login<br>settings are wrong|Read the Cloud Run revision<br>logs; set bothSMOKE_EMAIL<br>andSMOKE_PASSWORD, or<br>neither|



After fixing a setup problem (not the code): open the failed run and click Re-run all jobs. No new pull request is needed. 

#### **Official references** 

- <u>Reuse workflows (GitHub Docs)</u> 

- <u>Manage revisions (Cloud Run)</u> 

- <u>Execute jobs (Cloud Run)</u> 

- <u>Manage job executions (Cloud Run)</u> 

- <u>Logging and viewing logs in Cloud Run</u> 

### **Guide/Episode 8: Persistence and rollback** 

Videos: LEB2 / Learn It / Student Guide: GCP Deployment and CI/CD (Video) / Episode 8 

Prerequisite: Episode 7 is done, with two releases deployed by the pipeline: **A** (the first one) and **B** (the one with your visible change). deploy.yml is on main . 

Issue #8: no-branch; uses the Actions tab, app, and the Google Cloud Console only 

Criterion: GCP deployment and persistence; repeatable release pipeline 

**Goal** : prove that your data survives a release and a rollback and that you can put an older version back by running a workflow. A rollback changes only the app image; it does not roll back the database. 

**Adapt to your project.** This episode is partly project-specific. The rollback steps are the same for every project. What data you create and check depends on your project and tech stack: only data stored in the database (or another cloud service) survives, and data written to the container’s own disk is lost. TokTickIT keeps tickets, users, sessions and attachments in Cloud SQL. 

###### **Before you begin** 

- You can sign in to your app on the public Cloud Run URL. 

- You have the full 40-character SHA of release **A** : open its **Deploy demo** run, **Summary** , “Commit image tag”. 

#### **8.1 Roll back to release A** 

###### **Steps** 

1. **Create test data in your own app.** Open your public URL, sign in, and create a record that uses a main feature of your project (TokTickIT example: a ticket). If your app lets users upload a file, add one and compute its checksum on your computer: 

Get-FileHash .\your-file.pdf -Algorithm SHA256 ~~<u>|</u>~~ 

macOS or Linux: 

shasum -a 256 your-file.pdf 







2. Write down the record’s title or number and the checksum. 

3. Open **Actions → Deploy demo → Run workflow** . 



<!-- Start of picture text -->
Use wow<br>fom<br>imogefettaEmptyleonmit= tet bultotam and deploy ising,<br>U )<br><!-- End of picture text -->

4. Select branch **main** , paste the full SHA of release **A** into image_tag , and run it. 

5. Open the run. The test and build steps must be skipped; the deploy and the smoke test must pass. 

6. In the Cloud Run console, the newest revision has 100% traffic and uses the image digest of release **A** . 

7. Reload the app ( Ctrl+F5 ). The visible change from 7.7 is gone. 



<!-- Start of picture text -->
TokTickIT demo deployment v<br>+ Commit image tag] ssezascedozcerascaFs09adi9c17380034aF42<br>* Digest: asia-southeast1-docker.pkg.dev/cpe334-2026-<br>toktickit/toktickit/toktickit@sha2s6:193F450e2790791863F09coa6seecoc47dc6d83<br><!-- End of picture text -->



<!-- Start of picture text -->
HW Hide cl aternatvearfacts | = Fiter En y nam<br>= Description<br>Tags© Created<br>Bi esacoesss AxneTSecootsectucataDRNs2A SBM<br>DD Biesteccsr now a<br>O Box “ ho<br>Oo ees —<br>os - ar ne<br><!-- End of picture text -->

**Done when:** you have a record written down, the app shows the older version, and Cloud Run serves release A’s image. 

#### **8.2 Check that your data survived** 

###### **Steps** 

1. Reload the app. A signed-in user should still be signed in. 

2. Open the record from 8.1. It must still be there. 

3. If you uploaded a file, download it and compute its checksum again. It must equal the one you wrote down. 



<!-- Start of picture text -->
My Recent Tickets a<br><!-- End of picture text -->



**Done when:** the record (and the file, with the same checksum) and your sign-in are still there. (What you check depends on your project and tech stack.) 

#### **8.3 Roll forward** 

###### **Steps** 

1. Open **Actions → Deploy demo → Run workflow** , select main , and paste the **full 40-character SHA of release B** into image_tag (or leave image_tag empty to test, rebuild, and deploy the current `main`). Using release **B's SHA** reuses the exact image you already tested and skips the test and build steps. 



<!-- Start of picture text -->
( J<br><!-- End of picture text -->

2. When the run is green, reload the app. The visible change is back. 



<!-- Start of picture text -->
4workflow runs Aut 5<br>> Deploy demo<br><!-- End of picture text -->

3. Repeat the data check from 8.2. 

**Done when:** your change is back and the same data is still there. 

##### **Done when** 

- The record and attachment created before the rollback are still there, with the same checksum, after the rollback and after the roll-forward. 

- The rollback ran with tests and build skipped, and Cloud Run served the older image. 

- The roll-forward restored the current version through the pipeline. 

- (The data you check depends on your project and tech stack.) 

##### **If something fails** 

|**Symptom**|**Likely cause**|**Fix**|
|---|---|---|
|“Image tag must be a full<br>40-character commit SHA”|A short SHA was used|Copy the full SHA from the<br>run summary|
|Image digest not<br>found|That commit never built an image|Use the “Commit image tag”<br>from a successful**Deploy**<br>**demo**run|
|No**Run workflow**button, or<br>“Branch is not allowed to<br>deploy”|The workflow is not onmain, or<br>another branch is selected|Checkdeploy.ymlon<br>mainand selectmain|
|Data is missing after the<br>rollback|The data was not stored in the<br>database (for example saved on<br>the container disk)|Move it into the database or a<br>storage bucket, then redeploy|
|The page does not change<br>after the rollback|Browser cache, or traffic is not on<br>the new revision|Hard refresh; check the Cloud<br>Run revision traffic|



##### **Official references** 

● <u>Rollbacks, gradual rollouts, and traffic migration (Cloud Run)</u> 

### **Guide/Episode 9: Pause when you are not using it** 

Videos: none (self-check) Prerequisite: Episodes 5 to 8 are done and your app is running on Cloud Run with Cloud SQL. Issue no-branch; this episode uses Cloud Shell only Criterion: It keeps your cost low between labs. 

**Goal** : stop paying for what you do not use, without deleting anything. You pause the database and close public access, and later you bring both back. Your data stays. 

**Why this matters:** Cloud SQL runs and is billed all day, even with no users (about USD 10.7 per month for the instance at the size used in this lab, plus about USD 2.4 for 10 GB of storage; prices from the starter kit guide). Cloud Run scales down to zero when nobody visits, so it costs almost nothing while idle. Stopping the database is the part that saves money. A stopped database still costs for storage and backups. 

**Do not pause** while a pipeline run is in progress, during a demo, or before your work is graded 

**Adapt to your project.** This episode is partly project-specific. The commands are the same for every project, but the names depend on what you created in Episode 5. 

|**What it is**|**Example (TokTickIT)**|**Your project**|
|---|---|---|
|Cloud Run service|toktickit|Your service name|
|Cloud SQL instance|toktickit-pg|Your instance name|
|Project ID and<br>region|cpe334-team07,asia-southeast1|Your own|



###### **Before you begin** 

- Your app works on the public URL (open it and sign in). 

- You can open Cloud Shell, and your account can manage Cloud Run and Cloud SQL. 

- Set your values in Cloud Shell: 

   - export PROJECT_ID=YOUR_PROJECT_ID 

   - export REGION=YOUR_REGION 

#### **9.1 Pause** 

###### **Steps (code)** 

1. Close public access, so nobody can open the app: 

gcloud run services remove-iam-policy-binding toktickit \ --member=allUsers --role=roles/run.invoker \ --region $REGION --project $PROJECT_ID 

# Also enforce IAM invoker check (in case "Allow public access" was toggled in the Console): gcloud run services update toktickit \ 

--invoker-iam-check \ 

--region $REGION --project $PROJECT_ID 

2. Stop the database: 

gcloud sql instances patch toktickit-pg --activation-policy=NEVER --project $PROJECT_ID 

3. Check it: 

gcloud sql instances describe toktickit-pg --project $PROJECT_ID --format="value(settings.activationPolicy)" 

**The answer must be NEVER . Opening the app URL in a browser now shows an error (403).** 

**Done when:** the database shows NEVER and the public URL no longer opens your app. Your data and your images are still there. 

###### **Steps (console)** 

1. **Close public access.** Open **Cloud Run** 

   - <u>( https://console.cloud.google.com/run/services</u> ) and click your service. Open the **Security** tab, 

      - a. If the page says “This service is publicly accessible because ‘allUsers’ has been granted permission on the service”, click **Remove access for allUsers** . 

      - b. If the page shows **Allow public access** selected instead, select **Require authentication** , choose **Identity and Access Management (IAM)** , click **View diff & redeploy** , then **Deploy changes** .) 

      - c. Reload your app URL to check: it must show an error (403). 



<!-- Start of picture text -->
ect Aoktickit-xvemxyrawa-as.a.run.app<br>Error: Forbidden<br>Your client does not have permission to get URL / from this server.<br><!-- End of picture text -->



<!-- Start of picture text -->
Authentication @<br>© Allow public access<br>© Reauire authentication<br>Select between Identity and<br>Proxy (A Access Management (IAM) and/or identity Aware<br>Identity and Access Management (1AM)<br>Custom audiences: None<br>7 Ie ntity aware Proxy (IAP)<br>Manage authorized users with IAP. Use this to set advanced context awa<br>brand may be automaticaly configuredto enable IAP. Learn More (4<br>‘4. __ This service is publicly accessible because ‘allUsers' has.<br>been granted permission on the service.<br>Allow public access<br><!-- End of picture text -->

2. **Stop the database.** Open **Cloud SQL → Instances** , click your instance, and click **Stop** . In the dialog that says “Stop database instance?” click **Stop** . 

Link: <u>https://console.cloud.google.com/sql/instances</u> 

3. Wait until the instance shows as stopped. Open your app URL: **it now shows an error (403).** 



<!-- Start of picture text -->
= Google Cloud (% cessuzo2e Text ) [Search Dforresources docs products. Qseach) + HF OG)? Qe tien<br>S _Cloud sat ® instances «= GEEEEED Showinfopanel )( ‘team ) Recommendedfo<br>B cloud<br>it. corstartos K sa1 over<br>fe retnces | . © Ainstancesautomata runningerotedcommunity in Exended end-of Support. if versionsgrade ofthese PostgreSOlstancestoaand supported MySOLC  versionare eamHO boutsoemcout<br>a before the Extended Support stat date to vod actlonal charges Learn more<br>1 ‘SQLnewerServer 2017 reaches end‘of-ife in Oct 2027, Cloud SAL providesan in-place upgrade to Bi cloudsat featured<br>View afecteinstancesversions. This aoa good opportunty) (Dismiss o evaluate a mig-ation to PostgreSQL oetp document<br>Heath issues © Colapse details | View atlissue detais<br>Nothing<br>© B Cloud sat tor ys<br>high priority tp document of<br>ean<br>DataMbsecurty protection A SS—= (CreaCrea te  repicecone \ sd<br>PerformanceCost  &.capacty ConnectMt<br>oe Enable Gueryinights<br>Delete<br>"=CD Fiter_Enterstausproperty—instanceidname@ crtvalue tsves ‘Cloud SOL ection TypeNy Migrate databasetoinstanceagateto AloyO8 sq<br>oe toitickit pg Viewissves > Enterprise Postgres “AeSO isn<br><!-- End of picture text -->

#### **9.2 Resume** 

###### **Steps (code)** 

1. Start the database: 

gcloud sql instances patch toktickit-pg --activation-policy=ALWAYS --project $PROJECT_ID 

2. Open public access again: 

gcloud run services add-iam-policy-binding toktickit \ --member=allUsers --role=roles/run.invoker \ 

--region $REGION --project $PROJECT_ID 

3. Wait one to three minutes for the database to start, then open YOUR_URL/api/ready in a browser. It must report that the database is connected. Then sign in to your app. 

###### **Steps (console)** 

1. **Start the database.** Open **Cloud SQL → Instances** , click your instance, and click **Start** . In the dialog “Start database instance?” click **Start** . 

2. **Open public access again.** Open **Cloud Run → your service → Security** , select **Allow public access** , click **View diff & redeploy** , then **Deploy changes** . 

   - a. **<u>Note</u>** : if you open public access with this Console toggle, removing allUsers via CLI alone will not close it next time—either switch back to **Require authentication** here in the Console, or run: 

gcloud run services update toktickit --invoker-iam-check --region $REGION --project $PROJECT_ID 

3. Wait one to three minutes for the database to start, then open YOUR_URL/api/ready in a browser. It must report that the database is connected. Then sign in to your app. 

**Done when:** /api/ready reports the database as connected and you can sign in and see your data. 

#### **9.3 Rules while paused** 

- **Do not merge into main while paused. Deploy demo** would fail: the migration cannot reach the database and the smoke test cannot open the URL. Resume first, then merge. 

- If a run failed because the app was paused, resume, then open the failed run and click **Re-run all jobs** . 

- Pausing is not the same as the teardown in Episode 10: nothing is deleted here. 

#### **If something fails** 

|**Symptom**|**Likely cause**|**Fix**|
|---|---|---|
|“Permission denied”<br>on a command|Your account lacks rights on Cloud Run or<br>Cloud SQL|Use the account that<br>created the project, or ask<br>the owner|
|URL still shows 403<br>after resume|The public access binding was not restored<br>(or an organisation policy blocks public<br>access)|Run the step 2 command of<br>9.2 again and read its error|
|/api/readyfails<br>right after resume|The database is still starting|Wait a few minutes and try<br>again|
|**Deploy demo**failed<br>while paused|Expected: the database and URL were not<br>available|Resume, then re-run the<br>failed run|



### **Guide/Episode 10: Teardown at the end of term** 

Videos: none (self-check) 

Prerequisite: Your work is graded (or your instructor says you may shut down). Episodes 5 to 8 created the Google Cloud resources. 

Issue no-branch; this episode uses Cloud Shell and the consoles only 

**Goal** : delete everything you created in Google Cloud, check that nothing is left, and stop the pipeline from trying to deploy to resources that no longer exist. 

**Do not run the command before grading.** The database is deleted with all its data, and the demo disappears. This action cannot be undone. 

**Adapt to your project.** This episode is partly project-specific. deploy/teardown.sh has the TokTickIT names written in it. If your project uses other names, edit the list at the top of the script first. 

|**What it is**|**Example (TokTickIT)**|**Your project**|
|---|---|---|
|Cloud Run service<br>and job|toktickit,toktickit-migrate|Your names from<br>Episode 5|
|Cloud SQL instance|toktickit-pg|Your instance|
|Artifact Registry<br>repository|toktickit|Your repository|
|Secrets|toktickit-database-url,<br>toktickit-admin-password,<br>toktickit-demo-password|Your secrets|
|Runtime service<br>account|toktickit-runner|Your account|



###### **Before you begin** 

- You know your project ID and region (the ones you used in Episode 5). 

- You can open Cloud Shell and your repository is there (Episode 5). 

- You are sure the project holds nothing you still need. 

#### **10.1 Save your evidence** 

###### **Steps** 

1. Keep what you need for your report: screenshots, links to the successful **Deploy demo** runs, and the Cloud Run URL you submitted. 

2. Export any data you want to keep. The database is deleted with everything in it. 

**Done when:** your report evidence is saved outside Google Cloud. 

#### **10.2 Preview what will be deleted** 

###### **Steps** 

1. In Cloud Shell, open your repository folder and set your values: 

export PROJECT_ID=YOUR_PROJECT_ID export REGION=asia-southeast1 

2. Run the script in preview mode. It only prints the commands: 

DRY_RUN=1 bash deploy/teardown.sh 

3. Read the list. It must show only your own resources in your own project. 

**Done when:** the printed list matches the resources you expect to delete, and the project ID is yours. 

#### **10.3 Run the teardown** 

###### **Steps** 

1. Run it for real: 

bash deploy/teardown.sh 

2. When it asks you to type the project ID, type it exactly to confirm. A different answer stops the script. 

3. Wait for the end. The message “Teardown completed" does **not** prove everything was deleted, because each command is allowed to fail. Read the output for error lines. 

**Done when:** the script finished and you have read its errors, if any. 

#### **10.4 Check what is left** 

###### **Steps** 

1. List what still exists. Each list should be empty (or show only things you did not create): 

gcloud run services list --region $REGION --project $PROJECT_ID gcloud run jobs list --region $REGION --project $PROJECT_ID gcloud sql instances list --project $PROJECT_ID gcloud artifacts repositories list --location $REGION --project $PROJECT_ID gcloud secrets list --project $PROJECT_ID gcloud iam service-accounts list --project $PROJECT_ID gcloud storage buckets list --project $PROJECT_ID 

2. Delete anything of yours that is still there. The script does **not** remove Cloud Build storage buckets, so check the bucket list. 

3. Open **Billing** in the Google Cloud console and check the costs again after it updates. A budget is an alert, not a spending cap. 

**Done when:** none of the lists show your resources, and billing shows no running charges. 

#### **10.5 Remove the Episode 6 leftovers and stop the pipeline** 

The script does not delete what you created in Episode 6. 

###### **Steps** 

1. In Google Cloud: delete the service account toktickit-deployer ( **IAM & Admin → Service Accounts** ), and delete the pool github-actions ( **IAM & Admin → Workload Identity Federation** ). 

2. In GitHub: open **Actions → Deploy demo** and **Disable workflow** . Otherwise, every merge to main starts a deployment that fails because the resources are gone. 

3. Optionally delete the environment demo ( **Settings → Environments** ). Keep the ruleset on main if you still use the repository. 

**Done when:** the deployer account and the pool are gone and **Deploy demo** is disabled. 

**Alternative:** if the project was created only for this course, you can shut down the whole project in **IAM & Admin → Settings → Shut down** . This removes everything in it. Check the console message to see how long you can still recover a shut-down project before you rely on it. 

##### **Done when** 

- The preview matched your resources, and you confirmed the deletion with your project ID. 

- Every list in 10.4 is empty (or shows only things you did not create), and billing displays no running charges. 

- The Episode 6 account and pool are removed, and **Deploy demo** is disabled. 

- (The resource names depend on your project and tech stack.) 

##### **If something fails** 

|**Symptom**|**Likely cause**|**Fix**|
|---|---|---|
|“Error: PROJECT_ID is not<br>set”|No project is set in Cloud<br>Shell.|Runexport PROJECT_ID=...<br>again, orgcloud config set<br>project ...|
|“Aborted: confirmation<br>did not match."|The typed project ID<br>differs.|Run the script again and type the exact<br>ID.|
|“Teardown completed,"<br>but a resource is still<br>listed.|That command failed<br>(permissions or a different<br>name).|Read the error above it, then delete the<br>resource in the console or fix the name<br>in the script.|
|The Cloud Build bucket<br>remains.|The script does not delete<br>it.|Delete it from the bucket list in 10.4.|
|**The deploy demo**fails<br>after the teardown.|The pipeline points at<br>deleted resources.|Disable the workflow (10.5, step 2)|



