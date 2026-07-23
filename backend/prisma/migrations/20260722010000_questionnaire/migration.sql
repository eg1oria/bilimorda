-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "textRu" TEXT NOT NULL,
    "textKk" TEXT,
    "module" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "scoreTarget" TEXT NOT NULL,
    "reverseScored" BOOLEAN NOT NULL DEFAULT false,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QuestionnaireVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PublishedQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "sourceQuestionId" TEXT NOT NULL,
    "textRu" TEXT NOT NULL,
    "textKk" TEXT,
    "module" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "scoreTarget" TEXT NOT NULL,
    "reverseScored" BOOLEAN NOT NULL,
    CONSTRAINT "PublishedQuestion_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "QuestionnaireVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PublishedQuestion_sourceQuestionId_fkey" FOREIGN KEY ("sourceQuestionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "resultJson" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "abandonedAt" DATETIME,
    CONSTRAINT "TestAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestAttempt_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "QuestionnaireVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Answer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PublishedQuestion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Question_module_sortOrder_idx" ON "Question"("module", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionnaireVersion_number_key" ON "QuestionnaireVersion"("number");

-- CreateIndex
CREATE UNIQUE INDEX "PublishedQuestion_versionId_sourceQuestionId_key" ON "PublishedQuestion"("versionId", "sourceQuestionId");

-- CreateIndex
CREATE INDEX "PublishedQuestion_versionId_module_sortOrder_idx" ON "PublishedQuestion"("versionId", "module", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TestAttempt_tokenHash_key" ON "TestAttempt"("tokenHash");

-- CreateIndex
CREATE INDEX "TestAttempt_userId_startedAt_idx" ON "TestAttempt"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_attemptId_questionId_key" ON "Answer"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "Answer_questionId_idx" ON "Answer"("questionId");
