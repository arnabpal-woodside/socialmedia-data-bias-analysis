const chai = require("chai"),
    expect = chai.expect;


const config = require('./config.json');

var NaturalLangAnalysis = require('./NaturalLangAnalysis');


describe("Functionality Check of WATSON API", function () {

    let NLU = new NaturalLangAnalysis(config);

    it("Should Analyze sentiments", async function () {
        const docList = await NLU.processRequest();
        expect(docList).to.not.equals(null);

    });
});
