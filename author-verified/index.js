"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../common/utils");
const AuthorVerified_1 = require("./AuthorVerified");
const Action_1 = require("../common/Action");
const requestVerificationComment = (0, utils_1.getRequiredInput)(
	"requestVerificationComment"
);
const releasedLabel = (0, utils_1.getRequiredInput)("releasedLabel");
const verifiedLabel = (0, utils_1.getRequiredInput)("verifiedLabel");
const authorVerificationRequestedLabel = (0, utils_1.getRequiredInput)(
	"authorVerificationRequestedLabel"
);
class AuthorVerified extends Action_1.Action {
	constructor() {
		super(...arguments);
		this.id = "AuthorVerified";
	}
	runLabler(issue) {
		return new AuthorVerified_1.AuthorVerifiedLabeler(
			issue,
			requestVerificationComment,
			releasedLabel,
			authorVerificationRequestedLabel,
			verifiedLabel
		).run();
	}
	async onClosed(issue) {
		await this.runLabler(issue);
	}
	async onLabeled(issue, label) {
		if (
			label === authorVerificationRequestedLabel ||
			label === releasedLabel
		) {
			await this.runLabler(issue);
		}
	}
}
new AuthorVerified().run(); // eslint-disable-line
//# sourceMappingURL=index.js.map
