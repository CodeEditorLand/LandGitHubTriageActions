"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const github_1 = require("@actions/github");
const octokit_1 = require("../../../api/octokit");
const utils_1 = require("../../../common/utils");
const Action_1 = require("../../../common/Action");
const token = (0, utils_1.getRequiredInput)('token');
const debug = !!(0, utils_1.getInput)('__debug');
class ApplyLabels extends Action_1.Action {
    constructor() {
        super(...arguments);
        this.id = 'Classifier/Apply/ApplyLabels';
    }
    async onTriggered(github) {
        var _a, _b;
        const config = await github.readConfig((0, utils_1.getRequiredInput)('config-path'));
        const labelings = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(__dirname, '../issue_labels.json'), { encoding: 'utf8' }));
        for (const labeling of labelings) {
            const issue = new octokit_1.OctoKitIssue(token, github_1.context.repo, { number: labeling.number });
            const issueData = await issue.getIssue();
            if (!debug && issueData.assignee) {
                (0, utils_1.safeLog)('skipping, already assigned to: ', issueData.assignee);
                continue;
            }
            const assignee = labeling.assignee;
            if (assignee) {
                (0, utils_1.safeLog)('has assignee:', assignee);
                if (debug) {
                    if (!(await github.repoHasLabel(assignee))) {
                        (0, utils_1.safeLog)(`creating assignee label`);
                        await github.createLabel(assignee, 'ffa5a1', '');
                    }
                    await issue.addLabel(assignee);
                }
                const assigneeConfig = (_a = config.assignees) === null || _a === void 0 ? void 0 : _a[assignee];
                (0, utils_1.safeLog)(JSON.stringify({ assigneeConfig }));
                await Promise.all([
                    (assigneeConfig === null || assigneeConfig === void 0 ? void 0 : assigneeConfig.assign) ? !debug && issue.addAssignee(assignee) : Promise.resolve(),
                    (assigneeConfig === null || assigneeConfig === void 0 ? void 0 : assigneeConfig.comment) ? issue.postComment(assigneeConfig.comment) : Promise.resolve(),
                ]);
            }
            else if (config.randomAssignment && config.labels) {
                (0, utils_1.safeLog)('could not find assignee, picking a random one...');
                const available = Object.keys(config.labels).reduce((acc, area) => {
                    const areaConfig = config.labels[area];
                    if (areaConfig.assign) {
                        acc.push(...areaConfig.assign);
                    }
                    return acc;
                }, []);
                if (available) {
                    // Shuffle the array
                    for (let i = available.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [available[i], available[j]] = [available[j], available[i]];
                    }
                    if (!debug) {
                        const issue = new octokit_1.OctoKitIssue(token, github_1.context.repo, { number: labeling.number });
                        await issue.addLabel('triage-needed');
                        let i = 0;
                        const randomSelection = available[i];
                        (0, utils_1.safeLog)('assigning', randomSelection);
                        await issue.addAssignee(randomSelection);
                        const staleIssues = github.query({
                            q: `is:issue is:open label:triage-needed -label:stale -label:info-needed updated:<${(0, utils_1.daysAgoToHumanReadbleDate)(7)}`,
                        });
                        // Loop through assigning new people to issues which are over a week old and not triaged
                        for await (const page of staleIssues) {
                            for (const issue of page) {
                                i += 1;
                                if (i >= available.length) {
                                    i = 0;
                                }
                                (0, utils_1.safeLog)('assigning to stale issue', available[i]);
                                await issue.addAssignee(available[i]);
                                await issue.addLabel('stale');
                            }
                        }
                    }
                }
                else {
                    (0, utils_1.safeLog)('error assigning random: no assigness found');
                }
            }
            const label = labeling.area;
            if (label) {
                (0, utils_1.safeLog)(`adding label ${label} to issue ${issueData.number}`);
                if (debug) {
                    if (!(await github.repoHasLabel(label))) {
                        (0, utils_1.safeLog)(`creating label`);
                        await github.createLabel(label, 'f1d9ff', '');
                    }
                }
                const labelConfig = (_b = config.labels) === null || _b === void 0 ? void 0 : _b[label];
                await Promise.all([
                    (labelConfig === null || labelConfig === void 0 ? void 0 : labelConfig.applyLabel) || debug ? issue.addLabel(label) : Promise.resolve,
                    (labelConfig === null || labelConfig === void 0 ? void 0 : labelConfig.comment) ? issue.postComment(labelConfig.comment) : Promise.resolve(),
                    ...((labelConfig === null || labelConfig === void 0 ? void 0 : labelConfig.assign)
                        ? labelConfig.assign.map((assignee) => issue.addAssignee(assignee))
                        : []),
                ]);
            }
        }
    }
}
new ApplyLabels().run(); // eslint-disable-line
//# sourceMappingURL=index.js.map