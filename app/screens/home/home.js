import React, { Component } from 'react'
import { View, StyleSheet, AsyncStorage, TouchableHighlight, Text, Image, TouchableWithoutFeedback } from 'react-native'
import moment from 'moment'
import PopupDialog from 'react-native-popup-dialog'
import UserInfoService from './../../services/userInfoService'
import Transactions from './transactions'
import Auth from './../../util/auth'
import ResetNavigation from './../../util/resetNavigation'
import Colors from './../../config/colors'
import ReexService from '../../services/reexService'
import Header from './../../components/header'

export default class Home extends Component {
    static navigationOptions = {
        label: 'Home',
    }

    constructor(props) {
        super(props)
        this.state = {
            balance: 0,
            showTransaction: false,
            symbol: '',
            dataToShow: {
                currency: {},
            },
            reference: '',
            creditSwitch: true,
            debitSwitch: true,
        }
    }

    async componentWillMount() {
        try {
            const token = await AsyncStorage.getItem('token')
            if (token === null) {
                this.logout()
            }
            return token
        }
        catch (error) {
        }
    }

    componentDidMount() {
        this.getBalanceInfo()
        this.getUserInfo()
    }

    setBalance = (balance, divisibility) => {
        for (let i = 0; i < divisibility; i++) {
            balance = balance / 10
        }

        return balance
    }

    getUserInfo = async () => {
        let responseJson = await UserInfoService.getUserDetails()
        if (responseJson.status === "success") {
            AsyncStorage.removeItem('user')
            AsyncStorage.setItem('user', JSON.stringify(responseJson.data))
            let settings = responseJson.data.settings
            if (settings.allow_transactions === false) {
                this.setState({
                    creditSwitch: false,
                    debitSwitch: false
                })
            }
            if (settings.allow_debit_transactions === false) {
                this.setState({
                    debitSwitch: false
                })
            }
            if (settings.allow_credit_transactions === false) {
                this.setState({
                    creditSwitch: false
                })
            }
            const token = await AsyncStorage.getItem('token')
            if (token === null) {
                await this.logout()
            }
            else {
                let reex_address = await ReexService.getWallet(responseJson.data.id, responseJson.data.email)
                console.log(JSON.stringify(reex_address))
                if (reex_address.status === 'error') {
                    let wallet = await ReexService.createWallet(responseJson.data.id, responseJson.data.email);
                    if (wallet.status === 'success') {
                        AsyncStorage.removeItem('wallet')
                        AsyncStorage.setItem('wallet', JSON.stringify(wallet))
                        this.setState({ ready: true })
                    }
                    else {
                        this.setState({ ready: false })
                    }
                }
                else {
                    console.log('in success')
                    console.log(JSON.stringify(reex_address))
                    AsyncStorage.removeItem('wallet')
                    AsyncStorage.setItem('wallet', JSON.stringify(reex_address))
                    this.setState({ ready: true })
                }
            }
            //this.setState({ ready: true })
        }
        else {
            await this.logout()
        }
    }

    getBalanceInfo = async () => {
        let reex_address = await ReexService.getWallet('a882e28c-5bd1-4bab-b862-f5a6766033f4', 'danehollenbach@gmail.com')
        const wallet = await AsyncStorage.getItem('wallet')
        console.log('getting balance')
        console.log(JSON.stringify(reex_address))
        let responseJson = await ReexService.getBalance(wallet.id, wallet.email)
        if (responseJson.status === "success") {
            AsyncStorage.setItem('currency', JSON.stringify(responseJson))
            this.setState({symbol: responseJson.symbol})
            this.setState({balance: this.setBalance(responseJson.available_balance, responseJson.divisibility)})
        }
        else {
            this.logout()
        }
    }

    logout = () => {
        Auth.logout(this.props.navigation)
    }

    showDialog = (item) => {
        this.setState({ dataToShow: item });
        this.popupDialog.show()
    }

    getAmount = (amount = 0, divisibility) => {
        for (let i = 0; i < divisibility; i++) {
            amount = amount / 10
        }

        return amount.toFixed(8).replace(/\.?0+$/, "")
    }

    render() {
        /*let swipeBtns = [{
            text: 'Show',
            backgroundColor: Colors.lightgray,
            underlayColor: 'rgba(0, 0, 0, 1, 0.6)',
            onPress: () => this.props.navigation.navigate(
                'AccountCurrencies',
                {reference: this.state.reference}
            )
        }];*/
        return (
            <View style={styles.container}>
                <Header
                    navigation={this.props.navigation}
                    drawer
                    creditSwitch={this.state.creditSwitch}
                    debitSwitch={this.state.debitSwitch}
                />
                <View style={styles.balance}>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={{ fontSize: 25, color: 'white' }}>
                            {this.state.symbol}
                        </Text>
                        <Text style={{ paddingLeft: 5, fontSize: 40, color: 'white' }}>
                            {this.state.balance.toFixed(4).replace(/0{0,2}$/, "")}
                        </Text>
                    </View>
                </View>
                <View style={styles.transaction}>
                    <Transactions updateBalance={this.getBalanceInfo} showDialog={this.showDialog}
                        logout={this.logout} />
                </View>
                <View style={styles.buttonbar}>
                    <TouchableHighlight
                        style={styles.submit}
                        onPress={() => this.props.navigation.navigate("Receive")}>
                        <Text style={{ color: 'white', fontSize: 20 }}>
                            Receive
                        </Text>
                    </TouchableHighlight>
                    <TouchableHighlight
                        style={[styles.submit, { marginLeft: 25 }]}
                        onPress={() => this.props.navigation.navigate("SendTo")}>

                        <Text style={{ color: 'white', fontSize: 20 }}>
                            Send
                        </Text>
                    </TouchableHighlight>
                </View>
                <PopupDialog
                    ref={(popupDialog) => {
                        this.popupDialog = popupDialog;
                    }}
                    height={250}>
                    <View style={{ flex: 1 }}>
                        <View style={{ flex: 3, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                            <Image
                                source={require('./../../../assets/icons/placeholder.png')}
                                style={{ height: 80, width: 80, margin: 10 }}
                            />
                            <Text style={{ fontSize: 20, color: Colors.black }}>
                                {this.state.dataToShow.label + ": " + this.state.dataToShow.currency.symbol + this.getAmount(this.state.dataToShow.amount, this.state.dataToShow.currency.divisibility)}
                            </Text>
                        </View>
                        <View style={{
                            flex: 1,
                            flexDirection: 'row',
                            borderTopColor: Colors.lightgray,
                            borderTopWidth: 1,
                            paddingLeft: 20,
                            paddingRight: 20
                        }}>
                            <View style={{ flex: 2, justifyContent: 'center' }}>
                                <Text style={{ fontSize: 15, alignSelf: "flex-start", color: Colors.black }}>
                                    {moment(this.state.dataToShow.created).format('lll')}
                                </Text>
                            </View>
                            <View style={{ flex: 1, justifyContent: 'center' }}>
                                <Text style={{ fontSize: 15, alignSelf: "flex-end", color: Colors.black }}>
                                    {this.state.dataToShow.status}
                                </Text>
                            </View>
                        </View>
                    </View>
                </PopupDialog>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'white',
    },
    balance: {
        flex: 1,
        backgroundColor: Colors.blue,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    transaction: {
        flex: 5,
        backgroundColor: Colors.lightgray,
    },
    buttonbar: {
        position: 'absolute',
        bottom: 0,
        flexDirection: 'row',
        paddingHorizontal: 25,
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: 'transparent',
    },
    floatView: {
        position: 'absolute',
        width: 100,
        height: 100,
        top: 200,
        left: 40,
        backgroundColor: 'blue',
    },
    submit: {
        backgroundColor: Colors.blue,
        height: 50,
        borderRadius: 25,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
})

