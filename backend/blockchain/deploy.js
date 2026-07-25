async function main() {

  const Voting = await ethers.getContractFactory("Voting");

  const voting = await Voting.deploy();

  await voting.deployed();

  console.log(
    "Contract deployed to:",
    voting.address
  );
}

main();