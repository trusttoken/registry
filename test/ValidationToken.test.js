import assertRevert from './helpers/assertRevert'
import assertBalance from './helpers/assertBalance'
const ValidationToken = artifacts.require('ValidationToken')

contract('ValidationToken', function ([from, to]) {
    beforeEach(async function () {
        this.token = await ValidationToken.new()
    })

    describe('total supply', function () {
        it('returns uint max', async function () {
            const totalSupply = await this.token.totalSupply()
            assert.equal(totalSupply.toNumber(), +'0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
        })
    })

    describe('balanceOf', function () {
        describe('when the requested account has never gained/lost tokens', function () {
            it('returns 10000', async function () {
                await assertBalance(this.token, to, 10000)
            })
        })
    })

    describe('transfer', function () {
        describe('when not to the faucet', function () {
            describe('when the sender does not have enough balance', function () {
                it('reverts', async function () {
                    await assertRevert(this.token.transfer(to, 10001, { from: from }))
                })
            })

            describe('when the sender has enough balance', function () {
                it('transfers less than all', async function () {
                    await this.token.transfer(to, 100, { from: from })
                    await this.token.transfer(to, 200, { from: from })
                    await assertBalance(this.token, from, 9700)
                    await assertBalance(this.token, to, 10300)
                })

                it('transfers all', async function () {
                    await this.token.transfer(to, 10000, { from: from })
                    await assertBalance(this.token, from, 0)
                    await assertBalance(this.token, to, 20000)
                })

                it('emits a transfer event', async function () {
                    const { logs } = await this.token.transfer(to, 100, { from: from })

                    assert.equal(logs.length, 1)
                    assert.equal(logs[0].event, 'Transfer')
                    assert.equal(logs[0].args.from, from)
                    assert.equal(logs[0].args.to, to)
                    assert(logs[0].args.value.eq(100))
                })
            })
        })

        describe('when to the faucet', function () {
            const FAUCET = 0x01

            it('gives new coins', async function () {
                await this.token.transfer(FAUCET, 756, { from: from })
                await assertBalance(this.token, FAUCET, 10000)
                await assertBalance(this.token, from, 20000)
            })

            it('emits a transfer event', async function () {
                const { logs } = await this.token.transfer(FAUCET, 756, { from: from })

                assert.equal(logs.length, 1)
                assert.equal(logs[0].event, 'Transfer')
                assert.equal(logs[0].args.from, FAUCET)
                assert.equal(logs[0].args.to, from)
                assert(logs[0].args.value.eq(10000))
            })
        })
    })

    describe('transferFrom', function () {
        it('returns false', async function () {
            const result = await this.token.transferFrom.call(from, to, 100, { from: to })
            assert.equal(result, false)
        })
    })

    describe('approve', function () {
        it('returns false', async function () {
            const result = await this.token.approve.call(from, 100, { from: to })
            assert.equal(result, false)
        })
    })

    describe('allowance', function () {
        it('returns 0', async function () {
            const result = await this.token.allowance(from, to)
            assert.equal(result, 0)
        })
    })

    it('has 18 decimals', async function () {
        const result = await this.token.decimals()
        assert.equal(result, 18)
    })
})
