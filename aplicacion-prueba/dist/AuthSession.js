export class AuthSession {
    constructor(userId, name, loginDate) {
        this.userId = userId;
        this.name = name;
        this.loginDate = loginDate;
    }
    static fromJSON(json) {
        const data = JSON.parse(json);
        return new AuthSession(data.userId, data.name, data.loginDate);
    }
    getId() {
        return this.userId;
    }
}
//# sourceMappingURL=AuthSession.js.map