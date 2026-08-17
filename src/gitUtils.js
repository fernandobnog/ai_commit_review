// gitUtils.js - Façade Module
export {
  executeGitCommand,
  getCommits,
  getModifiedFiles,
  getFileDiff,
  getRepositoryDiff,
  clearStage,
  stageAllChanges,
  undoLastCommitSoft,
  commitChangesWithEditor,
  getStagedFileDiff,
  getStagedFilesDiffs,
} from "./gitCore.js";

export {
  getCurrentBranch,
  listBranches,
  switchBranch,
  pullChanges,
  pushChanges,
  mergeBranch,
  checkConflicts,
  getConflictDiff,
  writeConflictToTempFile,
  openFileInEditor,
  updateFileFromTemp,
} from "./gitBranch.js";

export {
  createPullRequest,
} from "./githubCli.js";
