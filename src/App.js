import React, { Component } from "react";
import Panel from "./Panel";
import getWeb3 from "./getWeb3";
import AirlineContract from "./airline";
import { AirlineService } from "./airlineService";

const converter = (web3) => {
    return (value) => {
        return web3.utils.fromWei(value.toString(), 'ether');
    }
}

export class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            balance: 0,
            refundableEther: 0,
            account: undefined,
            flights: [],
            customerFlights: []
        }
    }

    async componentDidMount(){
        console.log("component");
        this.web3 = await getWeb3();
        this.toEther = converter(this.web3);
        this.airline = await AirlineContract(this.web3.currentProvider);
        this.airlineService = new AirlineService(this.airline);

        //var account = (await this.web3.eth.getAccounts())[0];



       
       this.web3.currentProvider.on('accountsChanged', (accounts) => {
           this.setState({
               account: accounts[0]
               
           }, () => {
               this.load();
           })
       });   
       
       let flightPurchased = this.airline.FlightPurchased();
       flightPurchased.watch(function(err, result){
           const {customer, price, flight} = result.args;

           
           console.log(`You purchased a flight to ${flight}`) 
           console.log(customer)
           console.log(this.state.account)

       }.bind(this));
    }

    async getBalance(){
        let weiBalance = await this.web3.eth.getBalance(this.state.account);
        this.setState({
            balance: this.toEther(weiBalance)
        });
    }

    async getFlights(){        
        let flights = await this.airlineService.getFlights();
        this.setState({
            flights
        });
    }

    async getRefundableEther(){
        let refundableEther = this.toEther(await this.airlineService.getRefundableEther(this.state.account))
        this.setState({
            refundableEther
        });
    }

    async refundLoyaltyPoints(){
        await this.airlineService.redeemLoyaltyPoints(this.state.account);
    }

    async getCustomerFlights(){
        let customerFlights = await this.airlineService.getCustomerFlights(this.state.account);
        this.setState({
            customerFlights
        });
    }

    async buyFlight(flightIndex, flight){
        await this.airlineService.buyFlight(flightIndex, this.state.account, flight.price)
    }

    async load(){        
        this.getBalance();
        this.getFlights();
        this.getCustomerFlights();
        this.getRefundableEther();
    }

    render() {
        console.log(this.state)
        return <React.Fragment>
            <div className="jumbotron">
                <h4 className="display-4">Welcome to the Airline!</h4>
            </div>

            <div className="row">
                <div className="col-sm">
                    <Panel title="Balance">
                        <p>{this.state.account}</p>
                        <span>Balance: {this.state.balance}</span>
                    </Panel>
                </div>
                <div className="col-sm">
                    <Panel title="Loyalty points - refundable ether">
                    <p>{this.state.refundableEther} eth</p>
                    <button className="btn btn-sm bg-success text-white"
                    onClick={this.refundLoyaltyPoints.bind(this)}> Refund</button>
                    </Panel>
                </div>
            </div>
            <div className="row">
                <div className="col-sm">
                    <Panel title="Available flights">
                    {this.state.flights.map((flight, i) => {
                            return <div key={i}>
                                <span>{flight.name} - cost: {this.toEther(flight.price)}</span>
                                <button className="btn btn-sm btn-success text-white" onClick={() => this.buyFlight(i, flight, flight.price)}>Purchase</button>
                            </div>
                        })}

                    </Panel>
                </div>
                <div className="col-sm">
                    <Panel title="Your flights">
                        {this.state.customerFlights.map((flight, i) => {
                            return <div key={i}>
                                {flight.name} - cost: {flight.price}
                            </div>
                        })}
                    </Panel>
                </div>
            </div>
        </React.Fragment>
    }
}