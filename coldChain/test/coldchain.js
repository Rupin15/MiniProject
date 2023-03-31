const { expectEvent, BN } = require("@openzeppelin/test-helpers");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");
const ColdChain = artifacts.require("ColdChain");

contract('ColdChain', (accounts) => {
  before(async () => {
    this.owner = accounts[0];

    this.VACCINE_BRANDS = {
      Pfizer: "Phoer-BioNTech",
      Moedrna: "Moderna",
      Jannsen: "Johnson& Johnson's Janssen",
      Sputnik: "Sputnik V"
    }

    //enums
    this.ModeEnums = {
      ISSUER: { val: "ISSUER", pos: 0 },
      PROVER: { val: "PROVER", pos: 1 },
      VERIFIER: { val: "VERIFIER", pos: 2 },
    };

    this.StatusEnums = {
      manufacture: { val: "MANUFACTURED", pos: 0 },
      delivering1: { val: "DELIVERING_INTERNATIONAL", pos: 1 },
      stored: { val: "STORED", pos: 2 },
      delivering2: { val: "DELIVERING_LOCAL", pos: 3 },
      delivered: { val: "DELIVERED", pos: 4 },
    };

    this.defaultEntities = {
      manufactureA: { id: accounts[1], mode: this.ModeEnums.PROVER.val },
      manufactureB: { id: accounts[2], mode: this.ModeEnums.PROVER.val },
      inspector: { id: accounts[3], mode: this.ModeEnums.ISSUER.val },
      distributorGlobal: { id: accounts[4], mode: this.ModeEnums.VERIFIER.val },
      distributorLocal: { id: accounts[5], mode: this.ModeEnums.VERIFIER.val },
      immunizer: { id: accounts[6], mode: this.ModeEnums.ISSUER.val },
      traveller: { id: accounts[7], mode: this.ModeEnums.PROVER.val },
      borderAgent: { id: accounts[8], mode: this.ModeEnums.VERIFIER.val }
    };

    this.defaultVaccineBatches = {
      0: { brand: this.VACCINE_BRANDS.Pfizer, manufacturer: this.defaultEntities.manufactureA.id },
      1: { brand: this.VACCINE_BRANDS.Moedrna, manufacturer: this.defaultEntities.manufactureA.id },
      2: { brand: this.VACCINE_BRANDS.Jannsen, manufacturer: this.defaultEntities.manufactureB.id },
      4: { brand: this.VACCINE_BRANDS.Pfizer, manufacturer: this.defaultEntities.manufactureB.id },
      5: { brand: this.VACCINE_BRANDS.Pfizer, manufacturer: this.defaultEntities.manufactureB.id },
      6: { brand: this.VACCINE_BRANDS.Pfizer, manufacturer: this.defaultEntities.manufactureA.id },
      7: { brand: this.VACCINE_BRANDS.Moedrna, manufacturer: this.defaultEntities.manufactureA.id },
      8: { brand: this.VACCINE_BRANDS.Moedrna, manufacturer: this.defaultEntities.manufactureB.id },
      9: { brand: this.VACCINE_BRANDS.Sputnik, manufacturer: this.defaultEntities.manufactureB.id },
      10: { brand: this.VACCINE_BRANDS.Jannsen, manufacturer: this.defaultEntities.manufactureA.id },
    };

    this.coldChainInstance = await ColdChain.deployed();
   
  });

  // it('should add entities', async () => {
  //   for (const entity in this.defaultEntities) {
  //     const { id, mode } = this.defaultEntities[entity];
  //     const result = await this.coldChainInstance.addEntity(
  //       id,
  //       mode,
  //       { from: this.owner }
  //     );
  //     expectEvent(result.receipt, "AddEntity", {
  //       entityId: id,
  //       entityMode: mode
  //     });

  //     const retrievedEntity = await this.coldChainInstance.entities.call(id);
  //     assert.equal(id, retrievedEntity.id, "mismtched ids");
  //     assert.equal(this.ModeEnums[mode].pos, retrievedEntity.mode.toString(), "mismactedh modes")
  //   }
  // });

  // it('should add vaccine batch', async () => {
  //   for (let i = 0; i < Object.keys(this.defaultVaccineBatches).length; i++) {
  //     if (!this.defaultVaccineBatches[i]) break;
  //     const { brand, manufacturer } = this.defaultVaccineBatches[i];
  //     console.log("manu: " + manufacturer)
  //     const result = await this.coldChainInstance.addVaccineBatch(
  //       brand,
  //       manufacturer,
  //       { from: this.owner }
  //     );
  //     expectEvent(result.receipt, "AddVaccineBatch", {
  //       VaccineBatchId: String(i),
  //       manufacturer: manufacturer
  //     });

  //     const retrievedVaccineBatch = await this.coldChainInstance.vaccineBatches.call(i);
  //     console.log(retrievedVaccineBatch)
  //     assert.equal(i, retrievedVaccineBatch.id);
  //     assert.equal(brand, retrievedVaccineBatch.brand);
  //     assert.equal(manufacturer, retrievedVaccineBatch.manufacturer);
  //     assert.equal(undefined, retrievedVaccineBatch.certificates);

  //   }
  // });

  it('should sign a message and store as a certificate from the issuer to the prover', async () => {
    const mnemonic="candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";
    const providerOrUrl = "http://localhost:8545";
    const provider=new HDWalletProvider({
      mnemonic:mnemonic,
      providerOrUrl: providerOrUrl
    })
    this.web3=new Web3(provider);
    const {inspector,manufactureA}=this.defaultEntities;
    const vaccineBatchId=0;
    const message=`Inspector (${inspector.id}) certifies vaaccine batch #${vaccineBatchId} for manufacturer ${manufactureA.id} `;
    const signature=await this.web3.eth.sign(
     this.web3.utils.keccak256(message),
      inspector.id
    )
    console.log("manufacturer")
    console.log(manufactureA)
    const mode=await this.coldChainInstance.getModeOf(manufactureA.id);
    console.log("MODE: "+mode);
    const result=await this.coldChainInstance.issueCertificate(
      inspector.id,
      manufactureA.id,
      this.StatusEnums.manufacture.val,
      vaccineBatchId,
      signature,
      {from: this.owner})

      expectEvent(result.receipt,"IssueCertificate",{
        issuer: inspector.id,
        prover: manufactureA.id,
        certificateId: new BN(0),
      })
  });


});
