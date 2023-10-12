import React from "react";
import { Container, Row, Col } from "reactstrap";

import Highlight from "../components/Highlight";
import Loading from "../components/Loading";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { Web3Auth } from "@web3auth/single-factor-auth";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { CHAIN_NAMESPACES } from "@web3auth/base";

export const ProfileComponent = () => {
  const { user, getIdTokenClaims } = useAuth0();
  const [privateKey, setPrivateKey] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      // get the private key from local storage
      const ethPrivateKeyFromLocalStorage = localStorage.getItem("ethPrivateKey");
      if (ethPrivateKeyFromLocalStorage === "false") {
        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: {
            chainConfig: {
              chainNamespace: CHAIN_NAMESPACES.EIP155,
              chainId: "0x1",
              rpcTarget: "https://rpc.ankr.com/eth",
              displayName: "Ethereum Mainnet",
              blockExplorer: "https://etherscan.io",
              ticker: "ETH",
              tickerName: "Ethereum",
            },
          },
        });

        const web3auth = new Web3Auth({
          clientId: "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ", // Get your Client ID from the Web3Auth Dashboard
          web3AuthNetwork: "sapphire_mainnet",
          usePnPKey: "false", // By default, this SDK returns CoreKitKey by default.
        });

        await web3auth.init(privateKeyProvider);

        const token = await getIdTokenClaims();

        // Login the user
        const web3authSfaprovider = await web3auth.connect({
          verifier: "w3a-auth0-demo", // e.g. `web3auth-sfa-verifier` replace with your verifier name, and it has to be on the same network passed in init().
          verifierId: user.sub, // e.g. `Yux1873xnibdui` or `name@email.com` replace with your verifier id(sub or email)'s value.
          idToken: token.__raw, // or replace it with your newly created unused JWT Token.
        });

        const ethPrivateKey = await web3authSfaprovider.request({ method: "eth_private_key" });
        if (ethPrivateKey) {
          setPrivateKey(ethPrivateKey);
          localStorage.setItem("ethPrivateKey", ethPrivateKey);
        }
      } else {
        setPrivateKey(ethPrivateKeyFromLocalStorage);
      };
    }

    fetchData();
  }, [getIdTokenClaims, user.sub]);

  return (
    <Container className="mb-5">
      <Row className="align-items-center profile-header mb-5 text-center text-md-left">
        <Col md={2}>
          <img
            src={user.picture}
            alt="Profile"
            className="rounded-circle img-fluid profile-picture mb-3 mb-md-0"
          />
        </Col>
        <Col md>
          <h2>{user.name}</h2>
          <p className="lead text-muted">{user.email}</p>
          <p className="lead text-muted">pK: {privateKey}</p>
        </Col>
      </Row>
      <Row>
        <Highlight>{JSON.stringify(user, null, 2)}</Highlight>
      </Row>
    </Container>
  );
};

export default withAuthenticationRequired(ProfileComponent, {
  onRedirecting: () => <Loading />,
});
