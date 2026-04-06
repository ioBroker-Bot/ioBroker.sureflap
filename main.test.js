'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

// ─── Minimal adapter-core mock ────────────────────────────────────────────────

class MockAdapter {
    constructor() {
        this.log = {
            silly: sinon.stub(),
            debug: sinon.stub(),
            info: sinon.stub(),
            warn: sinon.stub(),
            error: sinon.stub(),
        };
    }
    on() {}
    getObject() {}
    delObject() {}
}

// ─── Load adapter under test ──────────────────────────────────────────────────

const createAdapter = proxyquire('./main', {
    '@iobroker/adapter-core': { Adapter: MockAdapter, '@noCallThru': true },
    './lib/surepet-api': class SurepetApi {},
});

function makeAdapter() {
    return createAdapter({});
}

// ─── Test fixtures ────────────────────────────────────────────────────────────

const DEVICE_TYPE_HUB = 1;
const DEVICE_TYPE_PET_FLAP = 3;
const DEVICE_TYPE_FEEDER = 4;
const DEVICE_TYPE_CAT_FLAP = 6;
const DEVICE_TYPE_WATER_DISPENSER = 8;

const HOUSEHOLDS = [
    { id: 10, name: 'Home' },
    { id: 20, name: 'Barn' },
];

const DEVICES = {
    10: [{ id: 1001, name: 'Hub', product_id: DEVICE_TYPE_HUB }],
    20: [
        { id: 2001, name: 'CatFlap', product_id: DEVICE_TYPE_CAT_FLAP },
        { id: 2002, name: 'AnotherFlap', product_id: DEVICE_TYPE_CAT_FLAP },
    ],
};

const PETS = [
    { id: 10, tag_id: 100, name: 'Whiskers', name_org: 'Whiskers!' },
    { id: 20, tag_id: 200, name: 'Mittens', name_org: 'Mittens!' },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Sureflap', () => {
    let adapter;

    beforeEach(() => {
        adapter = makeAdapter();
    });

    afterEach(() => {
        sinon.restore();
    });

    // ─── getHouseholdNameById ─────────────────────────────────────────────────

    describe('getHouseholdNameById', () => {
        beforeEach(() => {
            adapter.households = HOUSEHOLDS;
        });

        it('returns the name for a matching id', () => {
            expect(adapter.getHouseholdNameById(10)).to.equal('Home');
            expect(adapter.getHouseholdNameById(20)).to.equal('Barn');
        });

        it('returns undefined when id is not found', () => {
            expect(adapter.getHouseholdNameById(99)).to.be.undefined;
        });
    });

    // ─── doesTagsArrayContainTagId ────────────────────────────────────────────

    describe('doesTagsArrayContainTagId', () => {
        it('returns true when tag_id is present', () => {
            expect(adapter.doesTagsArrayContainTagId([{ id: 1 }, { id: 2 }], 2)).to.be.true;
        });

        it('returns false when tag_id is absent', () => {
            expect(adapter.doesTagsArrayContainTagId([{ id: 1 }, { id: 2 }], 3)).to.be.false;
        });

        it('returns false for an empty array', () => {
            expect(adapter.doesTagsArrayContainTagId([], 1)).to.be.false;
        });

        it('returns false when tags is undefined', () => {
            expect(adapter.doesTagsArrayContainTagId(undefined, 1)).to.be.false;
        });

        it('returns false when tags is not an array', () => {
            expect(adapter.doesTagsArrayContainTagId('not-an-array', 1)).to.be.false;
        });

        it('returns false when tag_id is undefined', () => {
            expect(adapter.doesTagsArrayContainTagId([{ id: 1 }], undefined)).to.be.false;
        });
    });

    // ─── Pet helpers ──────────────────────────────────────────────────────────

    describe('pet lookup', () => {
        beforeEach(() => {
            adapter.pets = PETS;
        });

        describe('_getPetByName', () => {
            it('returns the pet object when name matches', () => {
                expect(adapter._getPetByName('Whiskers')).to.deep.equal(PETS[0]);
            });

            it('returns undefined when name is not found', () => {
                expect(adapter._getPetByName('Ghost')).to.be.undefined;
            });
        });

        describe('_getPetByTagId', () => {
            it('returns the pet object when tag_id matches', () => {
                expect(adapter._getPetByTagId(200)).to.deep.equal(PETS[1]);
            });

            it('returns undefined when tag_id is not found', () => {
                expect(adapter._getPetByTagId(999)).to.be.undefined;
            });
        });

        describe('getPetIdByName', () => {
            it('returns the pet id for a matching name', () => {
                expect(adapter.getPetIdByName('Mittens')).to.equal(20);
            });

            it('returns -1 when not found', () => {
                expect(adapter.getPetIdByName('Ghost')).to.equal(-1);
            });
        });

        describe('getPetTagIdByName', () => {
            it('returns the tag_id for a matching name', () => {
                expect(adapter.getPetTagIdByName('Whiskers')).to.equal(100);
            });

            it('returns -1 when not found', () => {
                expect(adapter.getPetTagIdByName('Ghost')).to.equal(-1);
            });
        });

        describe('getPetIndexByName', () => {
            it('returns the array index for a matching name', () => {
                expect(adapter.getPetIndexByName('Whiskers')).to.equal(0);
                expect(adapter.getPetIndexByName('Mittens')).to.equal(1);
            });

            it('returns -1 when not found', () => {
                expect(adapter.getPetIndexByName('Ghost')).to.equal(-1);
            });
        });

        describe('getPetIdForTagId', () => {
            it('returns the pet id for a matching tag_id', () => {
                expect(adapter.getPetIdForTagId(100)).to.equal(10);
            });

            it('returns undefined when not found', () => {
                expect(adapter.getPetIdForTagId(999)).to.be.undefined;
            });
        });

        describe('getPetNameByTagId', () => {
            it('returns the pet name for a matching tag_id', () => {
                expect(adapter.getPetNameByTagId(200)).to.equal('Mittens');
            });

            it('returns undefined when not found', () => {
                expect(adapter.getPetNameByTagId(999)).to.be.undefined;
            });
        });

        describe('getPetNameOrgByTagId', () => {
            it('returns the original pet name for a matching tag_id', () => {
                expect(adapter.getPetNameOrgByTagId(100)).to.equal('Whiskers!');
            });

            it('returns undefined when not found', () => {
                expect(adapter.getPetNameOrgByTagId(999)).to.be.undefined;
            });
        });
    });

    // ─── Device helpers ───────────────────────────────────────────────────────

    describe('device lookup', () => {
        beforeEach(() => {
            adapter.households = HOUSEHOLDS;
            adapter.devices = DEVICES;
        });

        describe('_findDeviceByName', () => {
            it('returns device, householdId, and index when found', () => {
                expect(adapter._findDeviceByName('CatFlap', [DEVICE_TYPE_CAT_FLAP])).to.deep.equal({
                    device: DEVICES[20][0],
                    householdId: 20,
                    index: 0,
                });
            });

            it('returns the correct index for a non-first device', () => {
                expect(adapter._findDeviceByName('AnotherFlap', [DEVICE_TYPE_CAT_FLAP])).to.deep.equal({
                    device: DEVICES[20][1],
                    householdId: 20,
                    index: 1,
                });
            });

            it('returns undefined when name is not found', () => {
                expect(adapter._findDeviceByName('Unknown', [DEVICE_TYPE_HUB])).to.be.undefined;
            });

            it('returns undefined when type does not match', () => {
                expect(adapter._findDeviceByName('Hub', [DEVICE_TYPE_CAT_FLAP])).to.be.undefined;
            });

            it('matches any type when deviceTypes is empty', () => {
                const result = adapter._findDeviceByName('Hub', []);
                expect(result).to.not.be.undefined;
                expect(result.device.id).to.equal(1001);
            });

            it('returns the correct householdId when searching across households', () => {
                expect(adapter._findDeviceByName('Hub', [DEVICE_TYPE_HUB]).householdId).to.equal(10);
                expect(adapter._findDeviceByName('CatFlap', [DEVICE_TYPE_CAT_FLAP]).householdId).to.equal(20);
            });
        });

        describe('getDeviceIdByName', () => {
            it('returns the device id when found', () => {
                expect(adapter.getDeviceIdByName('Hub', [DEVICE_TYPE_HUB])).to.equal(1001);
            });

            it('returns -1 when not found', () => {
                expect(adapter.getDeviceIdByName('Unknown', [DEVICE_TYPE_HUB])).to.equal(-1);
            });
        });

        describe('getDeviceIndexAndHouseholdIdByName', () => {
            it('returns index and householdId when found', () => {
                expect(adapter.getDeviceIndexAndHouseholdIdByName('CatFlap', [DEVICE_TYPE_CAT_FLAP])).to.deep.equal({
                    index: 0,
                    householdId: 20,
                });
            });

            it('returns undefined when not found', () => {
                expect(adapter.getDeviceIndexAndHouseholdIdByName('Unknown', [])).to.be.undefined;
            });
        });

        describe('getDeviceTypeByName', () => {
            it('returns the product_id when name and type match', () => {
                expect(adapter.getDeviceTypeByName('Hub', [DEVICE_TYPE_HUB])).to.equal(DEVICE_TYPE_HUB);
            });

            it('returns -1 when name matches but type does not', () => {
                expect(adapter.getDeviceTypeByName('Hub', [DEVICE_TYPE_CAT_FLAP])).to.equal(-1);
            });

            it('returns -1 when name is not found', () => {
                expect(adapter.getDeviceTypeByName('Unknown', [DEVICE_TYPE_HUB])).to.equal(-1);
            });

            it('returns the product_id with empty deviceTypes (matches any type)', () => {
                // empty array means "all types", consistent with the other device lookup methods
                expect(adapter.getDeviceTypeByName('Hub', [])).to.equal(DEVICE_TYPE_HUB);
            });
        });

        describe('getDeviceById', () => {
            it('returns the device when id matches', () => {
                expect(adapter.getDeviceById(2001)).to.deep.equal(DEVICES[20][0]);
            });

            it('returns undefined when id is not found', () => {
                expect(adapter.getDeviceById(9999)).to.be.undefined;
            });
        });
    });

    // ─── getConnectedDeviceTypes ──────────────────────────────────────────────

    describe('getConnectedDeviceTypes', () => {
        function makeDevice(productId) {
            return { product_id: productId };
        }

        beforeEach(() => {
            adapter.households = [{ id: 1 }];
            adapter.devices = { 1: [] };
            adapter.hasFlap = false;
            adapter.hasFeeder = false;
            adapter.hasDispenser = false;
            adapter.firstLoop = true;
        });

        it('does nothing when firstLoop is false', () => {
            adapter.firstLoop = false;
            adapter.devices = { 1: [makeDevice(DEVICE_TYPE_CAT_FLAP)] };
            adapter.getConnectedDeviceTypes();
            expect(adapter.hasFlap).to.be.false;
        });

        it('sets hasFlap for a cat flap', () => {
            adapter.devices = { 1: [makeDevice(DEVICE_TYPE_CAT_FLAP)] };
            adapter.getConnectedDeviceTypes();
            expect(adapter.hasFlap).to.be.true;
        });

        it('sets hasFlap for a pet flap', () => {
            adapter.devices = { 1: [makeDevice(DEVICE_TYPE_PET_FLAP)] };
            adapter.getConnectedDeviceTypes();
            expect(adapter.hasFlap).to.be.true;
        });

        it('sets hasFeeder for a feeder', () => {
            adapter.devices = { 1: [makeDevice(DEVICE_TYPE_FEEDER)] };
            adapter.getConnectedDeviceTypes();
            expect(adapter.hasFeeder).to.be.true;
        });

        it('sets hasDispenser for a water dispenser', () => {
            adapter.devices = { 1: [makeDevice(DEVICE_TYPE_WATER_DISPENSER)] };
            adapter.getConnectedDeviceTypes();
            expect(adapter.hasDispenser).to.be.true;
        });

        it('does not set any flag for a hub', () => {
            adapter.devices = { 1: [makeDevice(DEVICE_TYPE_HUB)] };
            adapter.getConnectedDeviceTypes();
            expect(adapter.hasFlap).to.be.false;
            expect(adapter.hasFeeder).to.be.false;
            expect(adapter.hasDispenser).to.be.false;
        });

        it('sets multiple flags when multiple device types are present', () => {
            adapter.devices = { 1: [makeDevice(DEVICE_TYPE_CAT_FLAP), makeDevice(DEVICE_TYPE_FEEDER), makeDevice(DEVICE_TYPE_WATER_DISPENSER)] };
            adapter.getConnectedDeviceTypes();
            expect(adapter.hasFlap).to.be.true;
            expect(adapter.hasFeeder).to.be.true;
            expect(adapter.hasDispenser).to.be.true;
        });

        it('detects device types across multiple households', () => {
            adapter.households = [{ id: 1 }, { id: 2 }];
            adapter.devices = {
                1: [makeDevice(DEVICE_TYPE_CAT_FLAP)],
                2: [makeDevice(DEVICE_TYPE_FEEDER)],
            };
            adapter.getConnectedDeviceTypes();
            expect(adapter.hasFlap).to.be.true;
            expect(adapter.hasFeeder).to.be.true;
        });
    });

    // ─── normalizeLockMode ────────────────────────────────────────────────────

    describe('normalizeLockMode', () => {
        function makeDevice(lockingMode) {
            if (lockingMode === undefined) {
                return { status: {} };
            }
            return { status: { locking: { mode: lockingMode } } };
        }

        beforeEach(() => {
            adapter.households = [{ id: 1 }, { id: 2 }];
        });

        it('changes locking mode 4 to 0', () => {
            adapter.devices = { 1: [makeDevice(4)], 2: [] };
            adapter.normalizeLockMode();
            expect(adapter.devices[1][0].status.locking.mode).to.equal(0);
        });

        it('does not change locking modes 0, 1, 2, 3', () => {
            adapter.devices = { 1: [makeDevice(0), makeDevice(1), makeDevice(2), makeDevice(3)], 2: [] };
            adapter.normalizeLockMode();
            expect(adapter.devices[1][0].status.locking.mode).to.equal(0);
            expect(adapter.devices[1][1].status.locking.mode).to.equal(1);
            expect(adapter.devices[1][2].status.locking.mode).to.equal(2);
            expect(adapter.devices[1][3].status.locking.mode).to.equal(3);
        });

        it('skips devices without a locking status', () => {
            adapter.devices = { 1: [makeDevice(undefined)], 2: [] };
            adapter.normalizeLockMode();
            expect(adapter.devices[1][0].status).to.not.have.property('locking');
        });

        it('skips devices without a locking mode', () => {
            const device = { status: { locking: {} } };
            adapter.devices = { 1: [device], 2: [] };
            adapter.normalizeLockMode();
            expect(adapter.devices[1][0].status.locking).to.not.have.property('mode');
        });

        it('normalizes mode 4 across multiple households and devices', () => {
            adapter.devices = {
                1: [makeDevice(4), makeDevice(2)],
                2: [makeDevice(1), makeDevice(4)],
            };
            adapter.normalizeLockMode();
            expect(adapter.devices[1][0].status.locking.mode).to.equal(0);
            expect(adapter.devices[1][1].status.locking.mode).to.equal(2);
            expect(adapter.devices[2][0].status.locking.mode).to.equal(1);
            expect(adapter.devices[2][1].status.locking.mode).to.equal(0);
        });
    });

    // ─── normalizeCurfew ──────────────────────────────────────────────────────

    describe('normalizeCurfew', () => {
        function makeFlap(productId, curfewControl) {
            const device = { product_id: productId, control: {} };
            if (curfewControl !== undefined) {
                device.control.curfew = curfewControl;
            }
            return device;
        }

        beforeEach(() => {
            adapter.households = [{ id: 1 }];
            // stub time conversion so tests are timezone-independent
            sinon.stub(adapter, 'convertCurfewUtcTimesToLocalTimes').returnsArg(0);
        });

        it('wraps a non-array curfew in an array', () => {
            const entry = { lock_time: '22:00', unlock_time: '07:00' };
            adapter.devices = { 1: [makeFlap(DEVICE_TYPE_CAT_FLAP, entry)] };
            adapter.normalizeCurfew();
            expect(adapter.devices[1][0].control.curfew).to.deep.equal([entry]);
        });

        it('leaves an already-array curfew unchanged', () => {
            const entries = [{ lock_time: '22:00', unlock_time: '07:00' }];
            adapter.devices = { 1: [makeFlap(DEVICE_TYPE_CAT_FLAP, entries)] };
            adapter.normalizeCurfew();
            expect(adapter.devices[1][0].control.curfew).to.deep.equal(entries);
        });

        it('sets curfew to an empty array when curfew key is absent', () => {
            adapter.devices = { 1: [makeFlap(DEVICE_TYPE_CAT_FLAP)] };
            adapter.normalizeCurfew();
            expect(adapter.devices[1][0].control.curfew).to.deep.equal([]);
        });

        it('calls convertCurfewUtcTimesToLocalTimes with the curfew array', () => {
            const entries = [{ lock_time: '22:00', unlock_time: '07:00' }];
            adapter.devices = { 1: [makeFlap(DEVICE_TYPE_CAT_FLAP, entries)] };
            adapter.normalizeCurfew();
            expect(adapter.convertCurfewUtcTimesToLocalTimes).to.have.been.calledWith(entries);
        });

        it('processes both cat flap and pet flap devices', () => {
            adapter.devices = {
                1: [makeFlap(DEVICE_TYPE_CAT_FLAP), makeFlap(DEVICE_TYPE_PET_FLAP)],
            };
            adapter.normalizeCurfew();
            expect(adapter.devices[1][0].control.curfew).to.deep.equal([]);
            expect(adapter.devices[1][1].control.curfew).to.deep.equal([]);
        });

        it('does not touch non-flap devices', () => {
            const hub = { product_id: DEVICE_TYPE_HUB, control: {} };
            const feeder = { product_id: DEVICE_TYPE_FEEDER, control: {} };
            adapter.devices = { 1: [hub, feeder] };
            adapter.normalizeCurfew();
            expect(hub.control).to.not.have.property('curfew');
            expect(feeder.control).to.not.have.property('curfew');
        });

        it('normalizes curfews across multiple households', () => {
            adapter.households = [{ id: 1 }, { id: 2 }];
            adapter.devices = {
                1: [makeFlap(DEVICE_TYPE_CAT_FLAP)],
                2: [makeFlap(DEVICE_TYPE_PET_FLAP)],
            };
            adapter.normalizeCurfew();
            expect(adapter.devices[1][0].control.curfew).to.deep.equal([]);
            expect(adapter.devices[2][0].control.curfew).to.deep.equal([]);
        });
    });

    // ─── _normalizeName ───────────────────────────────────────────────────────

    describe('_normalizeName', () => {
        it('replaces spaces and special characters with underscores', () => {
            const obj = { name: "My Pet's Place" };
            adapter._normalizeName(obj);
            expect(obj.name).to.equal('My_Pet_s_Place');
        });

        it('saves the original name to name_org', () => {
            const obj = { name: 'My Home' };
            adapter._normalizeName(obj);
            expect(obj.name_org).to.equal('My Home');
        });

        it('does not modify a name that contains only word characters', () => {
            const obj = { name: 'Home_123' };
            adapter._normalizeName(obj);
            expect(obj.name).to.equal('Home_123');
            expect(obj.name_org).to.equal('Home_123');
        });

        it('does nothing when name is falsy', () => {
            const empty = { name: '' };
            const missing = {};
            adapter._normalizeName(empty);
            adapter._normalizeName(missing);
            expect(empty).to.not.have.property('name_org');
            expect(missing).to.not.have.property('name_org');
        });
    });

    // ─── normalizeHouseholdNames ──────────────────────────────────────────────

    describe('normalizeHouseholdNames', () => {
        it('replaces spaces with underscores', () => {
            adapter.households = [{ name: 'My Home' }];
            adapter.normalizeHouseholdNames();
            expect(adapter.households[0].name).to.equal('My_Home');
        });

        it('replaces special characters with underscores', () => {
            adapter.households = [{ name: "John's Place & Co." }];
            adapter.normalizeHouseholdNames();
            expect(adapter.households[0].name).to.equal('John_s_Place___Co_');
        });

        it('saves the original name to name_org', () => {
            adapter.households = [{ name: 'My Home' }];
            adapter.normalizeHouseholdNames();
            expect(adapter.households[0].name_org).to.equal('My Home');
        });

        it('does not change a name that has no special characters', () => {
            adapter.households = [{ name: 'Home_123' }];
            adapter.normalizeHouseholdNames();
            expect(adapter.households[0].name).to.equal('Home_123');
        });

        it('skips households with a falsy name', () => {
            adapter.households = [{ name: '' }, { name: null }, {}];
            adapter.normalizeHouseholdNames();
            adapter.households.forEach(h => expect(h).to.not.have.property('name_org'));
        });

        it('normalizes all households', () => {
            adapter.households = [{ name: 'First Home' }, { name: 'Second Home' }];
            adapter.normalizeHouseholdNames();
            expect(adapter.households[0].name).to.equal('First_Home');
            expect(adapter.households[1].name).to.equal('Second_Home');
        });
    });

    // ─── normalizeDeviceNames ─────────────────────────────────────────────────

    describe('normalizeDeviceNames', () => {
        beforeEach(() => {
            adapter.households = [{ id: 1 }];
        });

        it('replaces special characters in device name with underscores', () => {
            adapter.devices = { 1: [{ name: 'Cat Flap #1' }] };
            adapter.normalizeDeviceNames();
            expect(adapter.devices[1][0].name).to.equal('Cat_Flap__1');
        });

        it('saves the original device name to name_org', () => {
            adapter.devices = { 1: [{ name: 'Cat Flap #1' }] };
            adapter.normalizeDeviceNames();
            expect(adapter.devices[1][0].name_org).to.equal('Cat Flap #1');
        });

        it('replaces special characters in parent name with underscores', () => {
            adapter.devices = { 1: [{ name: 'Flap', parent: { name: 'My Hub' } }] };
            adapter.normalizeDeviceNames();
            expect(adapter.devices[1][0].parent.name).to.equal('My_Hub');
            expect(adapter.devices[1][0].parent.name_org).to.equal('My Hub');
        });

        it('skips parent normalization when device has no parent', () => {
            adapter.devices = { 1: [{ name: 'Flap' }] };
            adapter.normalizeDeviceNames();
            expect(adapter.devices[1][0]).to.not.have.property('parent');
        });

        it('skips parent normalization when parent has no name', () => {
            adapter.devices = { 1: [{ name: 'Flap', parent: {} }] };
            adapter.normalizeDeviceNames();
            expect(adapter.devices[1][0].parent).to.not.have.property('name_org');
        });

        it('skips devices with a falsy name', () => {
            adapter.devices = { 1: [{ name: '' }, { name: null }, {}] };
            adapter.normalizeDeviceNames();
            adapter.devices[1].forEach(d => expect(d).to.not.have.property('name_org'));
        });

        it('normalizes all devices across all households', () => {
            adapter.households = [{ id: 1 }, { id: 2 }];
            adapter.devices = {
                1: [{ name: 'Hub A' }],
                2: [{ name: 'Hub B' }],
            };
            adapter.normalizeDeviceNames();
            expect(adapter.devices[1][0].name).to.equal('Hub_A');
            expect(adapter.devices[2][0].name).to.equal('Hub_B');
        });
    });

    // ─── normalizePetNames ────────────────────────────────────────────────────

    describe('normalizePetNames', () => {
        it('replaces special characters in pet name with underscores', () => {
            adapter.pets = [{ name: 'Fluffy Jr.' }];
            adapter.normalizePetNames();
            expect(adapter.pets[0].name).to.equal('Fluffy_Jr_');
        });

        it('saves the original pet name to name_org', () => {
            adapter.pets = [{ name: 'Fluffy Jr.' }];
            adapter.normalizePetNames();
            expect(adapter.pets[0].name_org).to.equal('Fluffy Jr.');
        });

        it('does not change a name that has no special characters', () => {
            adapter.pets = [{ name: 'Whiskers_123' }];
            adapter.normalizePetNames();
            expect(adapter.pets[0].name).to.equal('Whiskers_123');
        });

        it('skips pets with a falsy name', () => {
            adapter.pets = [{ name: '' }, { name: null }, {}];
            adapter.normalizePetNames();
            adapter.pets.forEach(p => expect(p).to.not.have.property('name_org'));
        });

        it('normalizes all pets', () => {
            adapter.pets = [{ name: 'Mr. Whiskers' }, { name: "D'Artagnan" }];
            adapter.normalizePetNames();
            expect(adapter.pets[0].name).to.equal('Mr__Whiskers');
            expect(adapter.pets[1].name).to.equal('D_Artagnan');
        });
    });

    // ─── getDateFormattedAsISO ────────────────────────────────────────────────

    describe('getDateFormattedAsISO', () => {
        /**
         * Builds a fake Date whose local-time methods return exactly the given
         * values, making results timezone-independent.
         *
         * @param {object} p
         * @param {number} p.year        full year (e.g. 2024)
         * @param {number} p.month       1-based month (1 = January)
         * @param {number} p.day         day of month
         * @param {number} p.hours       0-23
         * @param {number} p.minutes     0-59
         * @param {number} p.seconds     0-59
         * @param {number} p.tzOffset    getTimezoneOffset() value in minutes
         *                               (negative for UTC+, positive for UTC-)
         */
        function fakeDate({ year, month, day, hours, minutes, seconds, tzOffset }) {
            return {
                getFullYear: () => year,
                getMonth: () => month - 1,
                getDate: () => day,
                getHours: () => hours,
                getMinutes: () => minutes,
                getSeconds: () => seconds,
                getTimezoneOffset: () => tzOffset,
            };
        }

        it('formats a date correctly in UTC', () => {
            const date = fakeDate({ year: 2024, month: 6, day: 15, hours: 12, minutes: 30, seconds: 45, tzOffset: 0 });
            expect(adapter.getDateFormattedAsISO(date)).to.equal('2024-06-15T12:30:45+00:00');
        });

        it('formats a date correctly with a positive UTC offset (UTC+2)', () => {
            const date = fakeDate({ year: 2024, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, tzOffset: -120 });
            expect(adapter.getDateFormattedAsISO(date)).to.equal('2024-01-01T00:00:00+02:00');
        });

        it('formats a date correctly with a negative UTC offset (UTC-5)', () => {
            const date = fakeDate({ year: 2024, month: 12, day: 31, hours: 23, minutes: 59, seconds: 59, tzOffset: 300 });
            expect(adapter.getDateFormattedAsISO(date)).to.equal('2024-12-31T23:59:59-05:00');
        });

        it('formats a date correctly with a fractional-hour UTC offset (UTC+5:30)', () => {
            const date = fakeDate({ year: 2024, month: 3, day: 7, hours: 8, minutes: 0, seconds: 0, tzOffset: -330 });
            expect(adapter.getDateFormattedAsISO(date)).to.equal('2024-03-07T08:00:00+05:30');
        });

        it('zero-pads single-digit month, day, hours, minutes, and seconds', () => {
            const date = fakeDate({ year: 2024, month: 1, day: 5, hours: 3, minutes: 4, seconds: 7, tzOffset: 0 });
            expect(adapter.getDateFormattedAsISO(date)).to.equal('2024-01-05T03:04:07+00:00');
        });
    });

    // ─── calculateLastMovement / calculateLastMovementForUnknownPet ──────────

    describe('calculateLastMovement and calculateLastMovementForUnknownPet', () => {
        const HID = 1;

        /** Builds a minimal valid datapoint for a known pet movement. */
        function knownPetDatapoint(petName, direction, createdAt, overrides = {}) {
            return {
                type: 0,
                created_at: createdAt,
                pets: [{ name: petName }],
                movements: [{ direction }],
                devices: [{ product_id: DEVICE_TYPE_CAT_FLAP, name: 'CatFlap', id: 2001 }],
                ...overrides,
            };
        }

        /** Builds a minimal valid datapoint for an unknown pet movement. */
        function unknownPetDatapoint(direction, createdAt, overrides = {}) {
            return {
                type: 7,
                created_at: createdAt,
                movements: [{ direction }],
                devices: [{ product_id: DEVICE_TYPE_CAT_FLAP, name: 'CatFlap', id: 2001 }],
                ...overrides,
            };
        }

        beforeEach(() => {
            adapter.history = { [HID]: [] };
        });

        // ── calculateLastMovement ─────────────────────────────────────────────

        describe('calculateLastMovement', () => {
            it('returns {} when history is not an array', () => {
                adapter.history = {};
                expect(adapter.calculateLastMovement('Whiskers', HID)).to.deep.equal({});
            });

            it('returns {} for an empty history', () => {
                expect(adapter.calculateLastMovement('Whiskers', HID)).to.deep.equal({});
            });

            it('returns {} when no entry has type 0', () => {
                adapter.history[HID] = [knownPetDatapoint('Whiskers', 1, '2024-01-01T10:00:00Z', { type: 7 })];
                expect(adapter.calculateLastMovement('Whiskers', HID)).to.deep.equal({});
            });

            it('returns {} when pet name does not match', () => {
                adapter.history[HID] = [knownPetDatapoint('Mittens', 1, '2024-01-01T10:00:00Z')];
                expect(adapter.calculateLastMovement('Whiskers', HID)).to.deep.equal({});
            });

            it('returns {} when movement direction is 0', () => {
                adapter.history[HID] = [knownPetDatapoint('Whiskers', 0, '2024-01-01T10:00:00Z')];
                expect(adapter.calculateLastMovement('Whiskers', HID)).to.deep.equal({});
            });

            it('returns {} when device product_id is not a flap', () => {
                adapter.history[HID] = [
                    knownPetDatapoint('Whiskers', 1, '2024-01-01T10:00:00Z', {
                        devices: [{ product_id: DEVICE_TYPE_HUB, name: 'Hub', id: 1001 }],
                    }),
                ];
                expect(adapter.calculateLastMovement('Whiskers', HID)).to.deep.equal({});
            });

            it('returns {} when device is missing name or id', () => {
                adapter.history[HID] = [
                    knownPetDatapoint('Whiskers', 1, '2024-01-01T10:00:00Z', {
                        devices: [{ product_id: DEVICE_TYPE_CAT_FLAP }],
                    }),
                ];
                expect(adapter.calculateLastMovement('Whiskers', HID)).to.deep.equal({});
            });

            it('returns movement data for a valid entry', () => {
                adapter.history[HID] = [knownPetDatapoint('Whiskers', 1, '2024-01-01T10:00:00Z')];
                expect(adapter.calculateLastMovement('Whiskers', HID)).to.deep.equal({
                    last_direction: 1,
                    last_flap: 'CatFlap',
                    last_flap_id: 2001,
                    last_time: '2024-01-01T10:00:00Z',
                });
            });

            it('accepts both cat flap and pet flap device types', () => {
                adapter.history[HID] = [
                    knownPetDatapoint('Whiskers', 2, '2024-01-01T10:00:00Z', {
                        devices: [{ product_id: DEVICE_TYPE_PET_FLAP, name: 'PetFlap', id: 3001 }],
                    }),
                ];
                expect(adapter.calculateLastMovement('Whiskers', HID)).to.include({ last_flap_id: 3001 });
            });

            it('returns the most recent entry when multiple valid entries exist', () => {
                adapter.history[HID] = [
                    knownPetDatapoint('Whiskers', 1, '2024-01-01T10:00:00Z'),
                    knownPetDatapoint('Whiskers', 2, '2024-01-01T12:00:00Z'),
                ];
                expect(adapter.calculateLastMovement('Whiskers', HID)).to.include({
                    last_direction: 2,
                    last_time: '2024-01-01T12:00:00Z',
                });
            });

            it('ignores entries for other pets when finding the most recent', () => {
                adapter.history[HID] = [
                    knownPetDatapoint('Mittens', 1, '2024-01-01T12:00:00Z'),
                    knownPetDatapoint('Whiskers', 2, '2024-01-01T10:00:00Z'),
                ];
                expect(adapter.calculateLastMovement('Whiskers', HID)).to.include({
                    last_time: '2024-01-01T10:00:00Z',
                });
            });
        });

        // ── calculateLastMovementForUnknownPet ────────────────────────────────

        describe('calculateLastMovementForUnknownPet', () => {
            it('returns {} when history is not an array', () => {
                adapter.history = {};
                expect(adapter.calculateLastMovementForUnknownPet(HID)).to.deep.equal({});
            });

            it('returns {} for an empty history', () => {
                expect(adapter.calculateLastMovementForUnknownPet(HID)).to.deep.equal({});
            });

            it('returns {} when no entry has type 7', () => {
                adapter.history[HID] = [unknownPetDatapoint(1, '2024-01-01T10:00:00Z', { type: 0 })];
                expect(adapter.calculateLastMovementForUnknownPet(HID)).to.deep.equal({});
            });

            it('returns {} when entry has a pets array (known pet)', () => {
                adapter.history[HID] = [
                    unknownPetDatapoint(1, '2024-01-01T10:00:00Z', { pets: [{ name: 'Whiskers' }] }),
                ];
                expect(adapter.calculateLastMovementForUnknownPet(HID)).to.deep.equal({});
            });

            it('returns {} when movement direction is 0', () => {
                adapter.history[HID] = [unknownPetDatapoint(0, '2024-01-01T10:00:00Z')];
                expect(adapter.calculateLastMovementForUnknownPet(HID)).to.deep.equal({});
            });

            it('returns {} when device product_id is not a flap', () => {
                adapter.history[HID] = [
                    unknownPetDatapoint(1, '2024-01-01T10:00:00Z', {
                        devices: [{ product_id: DEVICE_TYPE_HUB, name: 'Hub', id: 1001 }],
                    }),
                ];
                expect(adapter.calculateLastMovementForUnknownPet(HID)).to.deep.equal({});
            });

            it('returns {} when device is missing name or id', () => {
                adapter.history[HID] = [
                    unknownPetDatapoint(1, '2024-01-01T10:00:00Z', {
                        devices: [{ product_id: DEVICE_TYPE_CAT_FLAP }],
                    }),
                ];
                expect(adapter.calculateLastMovementForUnknownPet(HID)).to.deep.equal({});
            });

            it('returns movement data for a valid unknown pet entry', () => {
                adapter.history[HID] = [unknownPetDatapoint(1, '2024-01-01T10:00:00Z')];
                expect(adapter.calculateLastMovementForUnknownPet(HID)).to.deep.equal({
                    last_direction: 1,
                    last_flap: 'CatFlap',
                    last_flap_id: 2001,
                    last_time: '2024-01-01T10:00:00Z',
                });
            });

            it('returns the most recent entry when multiple valid entries exist', () => {
                adapter.history[HID] = [
                    unknownPetDatapoint(1, '2024-01-01T10:00:00Z'),
                    unknownPetDatapoint(2, '2024-01-01T12:00:00Z'),
                ];
                expect(adapter.calculateLastMovementForUnknownPet(HID)).to.include({
                    last_direction: 2,
                    last_time: '2024-01-01T12:00:00Z',
                });
            });
        });
    });

    // ─── isCurfewActive ───────────────────────────────────────────────────────

    describe('isCurfewActive', () => {
        /**
         * Freezes the clock so that new Date().getHours() === hours and
         * new Date().getMinutes() === minutes, regardless of timezone.
         */
        function setLocalTime(hours, minutes) {
            const d = new Date();
            d.setHours(hours, minutes, 0, 0);
            sinon.useFakeTimers(d.getTime());
        }

        const entry = (lock, unlock, enabled = true) => ({ enabled, lock_time: lock, unlock_time: unlock });

        it('returns false for an empty curfew array', () => {
            setLocalTime(12, 0);
            expect(adapter.isCurfewActive([])).to.be.false;
        });

        it('returns false when entry has enabled: false', () => {
            setLocalTime(12, 0);
            expect(adapter.isCurfewActive([entry('08:00', '17:00', false)])).to.be.false;
        });

        it('returns false when entry is missing enabled', () => {
            setLocalTime(12, 0);
            expect(adapter.isCurfewActive([{ lock_time: '08:00', unlock_time: '17:00' }])).to.be.false;
        });

        it('returns false when entry is missing lock_time', () => {
            setLocalTime(12, 0);
            expect(adapter.isCurfewActive([{ enabled: true, unlock_time: '17:00' }])).to.be.false;
        });

        it('returns false when entry is missing unlock_time', () => {
            setLocalTime(12, 0);
            expect(adapter.isCurfewActive([{ enabled: true, lock_time: '08:00' }])).to.be.false;
        });

        // same-day window: 08:00 – 17:00

        it('returns false when current time is before a same-day window', () => {
            setLocalTime(7, 59);
            expect(adapter.isCurfewActive([entry('08:00', '17:00')])).to.be.false;
        });

        it('returns true when current time is exactly at the start of a same-day window', () => {
            setLocalTime(8, 0);
            expect(adapter.isCurfewActive([entry('08:00', '17:00')])).to.be.true;
        });

        it('returns true when current time is inside a same-day window', () => {
            setLocalTime(12, 30);
            expect(adapter.isCurfewActive([entry('08:00', '17:00')])).to.be.true;
        });

        it('returns false when current time is exactly at the end of a same-day window', () => {
            setLocalTime(17, 0);
            expect(adapter.isCurfewActive([entry('08:00', '17:00')])).to.be.false;
        });

        it('returns false when current time is after a same-day window', () => {
            setLocalTime(17, 1);
            expect(adapter.isCurfewActive([entry('08:00', '17:00')])).to.be.false;
        });

        // overnight window: 22:00 – 07:00

        it('returns false when current time is before an overnight window', () => {
            setLocalTime(21, 59);
            expect(adapter.isCurfewActive([entry('22:00', '07:00')])).to.be.false;
        });

        it('returns true when current time is exactly at the start of an overnight window', () => {
            setLocalTime(22, 0);
            expect(adapter.isCurfewActive([entry('22:00', '07:00')])).to.be.true;
        });

        it('returns true when current time is after the start of an overnight window (before midnight)', () => {
            setLocalTime(23, 30);
            expect(adapter.isCurfewActive([entry('22:00', '07:00')])).to.be.true;
        });

        it('returns true when current time is inside an overnight window (after midnight)', () => {
            setLocalTime(6, 0);
            expect(adapter.isCurfewActive([entry('22:00', '07:00')])).to.be.true;
        });

        it('returns false when current time is exactly at the end of an overnight window', () => {
            setLocalTime(7, 0);
            expect(adapter.isCurfewActive([entry('22:00', '07:00')])).to.be.false;
        });

        it('returns false when current time is after the end of an overnight window', () => {
            setLocalTime(8, 0);
            expect(adapter.isCurfewActive([entry('22:00', '07:00')])).to.be.false;
        });

        // multiple entries

        it('returns true when at least one of multiple entries is active', () => {
            setLocalTime(12, 0);
            expect(adapter.isCurfewActive([entry('22:00', '07:00'), entry('08:00', '17:00')])).to.be.true;
        });

        it('returns false when none of multiple entries is active', () => {
            setLocalTime(20, 0);
            expect(adapter.isCurfewActive([entry('22:00', '07:00'), entry('08:00', '17:00')])).to.be.false;
        });
    });

    // ─── arrayContainsCurfewAttributes ───────────────────────────────────────

    describe('arrayContainsCurfewAttributes', () => {
        const valid = (lock, unlock) => ({ lock_time: lock, unlock_time: unlock });

        it('returns true for an array of valid curfew entries', () => {
            expect(adapter.arrayContainsCurfewAttributes([valid('22:00', '07:00')])).to.be.true;
        });

        it('returns true for multiple valid entries', () => {
            expect(adapter.arrayContainsCurfewAttributes([valid('22:00', '07:00'), valid('23:30', '06:15')])).to.be.true;
        });

        it('returns true for an empty array', () => {
            expect(adapter.arrayContainsCurfewAttributes([])).to.be.true;
        });

        it('returns false when any entry is missing lock_time', () => {
            expect(adapter.arrayContainsCurfewAttributes([{ unlock_time: '07:00' }])).to.be.false;
        });

        it('returns false when any entry is missing unlock_time', () => {
            expect(adapter.arrayContainsCurfewAttributes([{ lock_time: '22:00' }])).to.be.false;
        });

        it('returns false when one entry in a multi-entry array is invalid', () => {
            expect(adapter.arrayContainsCurfewAttributes([valid('22:00', '07:00'), { lock_time: '22:00' }])).to.be.false;
        });

        it('returns false for an invalid lock_time format', () => {
            expect(adapter.arrayContainsCurfewAttributes([valid('9:00', '07:00')])).to.be.false;   // missing leading zero
            expect(adapter.arrayContainsCurfewAttributes([valid('24:00', '07:00')])).to.be.false;  // hour out of range
            expect(adapter.arrayContainsCurfewAttributes([valid('22:60', '07:00')])).to.be.false;  // minute out of range
        });

        it('returns false for an invalid unlock_time format', () => {
            expect(adapter.arrayContainsCurfewAttributes([valid('22:00', '7:00')])).to.be.false;   // missing leading zero
            expect(adapter.arrayContainsCurfewAttributes([valid('22:00', '24:00')])).to.be.false;  // hour out of range
            expect(adapter.arrayContainsCurfewAttributes([valid('22:00', '07:60')])).to.be.false;  // minute out of range
        });

        it('accepts boundary time values 00:00 and 23:59', () => {
            expect(adapter.arrayContainsCurfewAttributes([valid('00:00', '23:59')])).to.be.true;
        });
    });

    // ─── _deleteObjectIfExists ────────────────────────────────────────────────

    describe('_deleteObjectIfExists', () => {
        const fakeObj = { _id: 'sureflap.0.test', type: 'state', common: { name: 'device-123' } };
        let getObjectStub;
        let delObjectStub;

        beforeEach(() => {
            getObjectStub = sinon.stub(adapter, 'getObject');
            delObjectStub = sinon.stub(adapter, 'delObject');
        });

        it('resolves without deleting when object does not exist', async () => {
            getObjectStub.callsArgWith(1, null, null);
            await adapter._deleteObjectIfExists('test.obj', false);
            expect(delObjectStub).not.to.have.been.called;
        });

        it('resolves and deletes when object exists', async () => {
            getObjectStub.callsArgWith(1, null, fakeObj);
            delObjectStub.callsArgWith(2, null);
            await adapter._deleteObjectIfExists('test.obj', false);
            expect(delObjectStub).to.have.been.calledOnce;
        });

        it('passes the recursive flag to delObject', async () => {
            getObjectStub.callsArgWith(1, null, fakeObj);
            delObjectStub.callsArgWith(2, null);
            await adapter._deleteObjectIfExists('test.obj', true);
            expect(delObjectStub).to.have.been.calledWith(fakeObj._id, { recursive: true });
        });

        it('passes the object to the condition function', async () => {
            getObjectStub.callsArgWith(1, null, fakeObj);
            delObjectStub.callsArgWith(2, null);
            const condition = sinon.stub().returns(true);
            await adapter._deleteObjectIfExists('test.obj', false, condition);
            expect(condition).to.have.been.calledWith(fakeObj);
        });

        it('resolves without deleting when condition returns false', async () => {
            getObjectStub.callsArgWith(1, null, fakeObj);
            await adapter._deleteObjectIfExists('test.obj', false, () => false);
            expect(delObjectStub).not.to.have.been.called;
        });

        it('calls conditionFailMessage with the object when condition fails', async () => {
            getObjectStub.callsArgWith(1, null, fakeObj);
            const conditionFailMessage = sinon.stub().returns('reason');
            await adapter._deleteObjectIfExists('test.obj', false, () => false, conditionFailMessage);
            expect(conditionFailMessage).to.have.been.calledWith(fakeObj);
        });

        it('rejects when delObject returns an error', async () => {
            getObjectStub.callsArgWith(1, null, fakeObj);
            delObjectStub.callsArgWith(2, new Error('delete failed'));
            await expect(adapter._deleteObjectIfExists('test.obj', false)).to.be.rejected;
        });
    });

    // ─── deleteObjectIfExistsAndHasType ───────────────────────────────────────

    describe('deleteObjectIfExistsAndHasType', () => {
        let getObjectStub;
        let delObjectStub;

        beforeEach(() => {
            getObjectStub = sinon.stub(adapter, 'getObject');
            delObjectStub = sinon.stub(adapter, 'delObject');
        });

        it('deletes when the object type matches', async () => {
            getObjectStub.callsArgWith(1, null, { _id: 'test.obj', type: 'channel' });
            delObjectStub.callsArgWith(2, null);
            await adapter.deleteObjectIfExistsAndHasType('test.obj', 'channel', true);
            expect(delObjectStub).to.have.been.calledOnce;
        });

        it('does not delete when the object type does not match', async () => {
            getObjectStub.callsArgWith(1, null, { _id: 'test.obj', type: 'state' });
            await adapter.deleteObjectIfExistsAndHasType('test.obj', 'channel', false);
            expect(delObjectStub).not.to.have.been.called;
        });
    });

    // ─── deleteObjectWithDeviceIdIfExists ─────────────────────────────────────

    describe('deleteObjectWithDeviceIdIfExists', () => {
        let getObjectStub;
        let delObjectStub;

        beforeEach(() => {
            getObjectStub = sinon.stub(adapter, 'getObject');
            delObjectStub = sinon.stub(adapter, 'delObject');
        });

        it('deletes when common.name contains the device_id', async () => {
            getObjectStub.callsArgWith(1, null, { _id: 'test.obj', common: { name: 'hub-device-123-x' } });
            delObjectStub.callsArgWith(2, null);
            await adapter.deleteObjectWithDeviceIdIfExists('test.obj', 'device-123', false);
            expect(delObjectStub).to.have.been.calledOnce;
        });

        it('does not delete when common.name does not contain the device_id', async () => {
            getObjectStub.callsArgWith(1, null, { _id: 'test.obj', common: { name: 'hub-other-456' } });
            await adapter.deleteObjectWithDeviceIdIfExists('test.obj', 'device-123', false);
            expect(delObjectStub).not.to.have.been.called;
        });

        it('does not delete when common.name is missing', async () => {
            getObjectStub.callsArgWith(1, null, { _id: 'test.obj', common: {} });
            await adapter.deleteObjectWithDeviceIdIfExists('test.obj', 'device-123', false);
            expect(delObjectStub).not.to.have.been.called;
        });

        it('does not delete when common is missing', async () => {
            getObjectStub.callsArgWith(1, null, { _id: 'test.obj' });
            await adapter.deleteObjectWithDeviceIdIfExists('test.obj', 'device-123', false);
            expect(delObjectStub).not.to.have.been.called;
        });
    });

    // ─── isVersionLessThan ────────────────────────────────────────────────────

    describe('isVersionLessThan', () => {
        let adapter;

        beforeEach(() => {
            adapter = createAdapter();
        });

        it('returns false when version is undefined', () => {
            expect(adapter.isVersionLessThan(undefined, '3.0.0')).to.be.false;
        });

        it('returns false when version is null', () => {
            expect(adapter.isVersionLessThan(null, '3.0.0')).to.be.false;
        });

        it('returns false when version is unknown', () => {
            expect(adapter.isVersionLessThan('unknown', '3.0.0')).to.be.false;
        });

        it('returns false when version has fewer than 3 parts', () => {
            expect(adapter.isVersionLessThan('2.9', '3.0.0')).to.be.false;
        });

        it('returns false when lessThan is undefined', () => {
            expect(adapter.isVersionLessThan('2.9.0', undefined)).to.be.false;
        });

        it('returns false when lessThan is null', () => {
            expect(adapter.isVersionLessThan('2.9.0', null)).to.be.false;
        });

        it('returns false when lessThan is unknown', () => {
            expect(adapter.isVersionLessThan('2.9.0', 'unknown')).to.be.false;
        });

        it('returns false when lessThan has fewer than 3 parts', () => {
            expect(adapter.isVersionLessThan('2.9.0', '3.0')).to.be.false;
        });

        it('returns false when versions are equal', () => {
            expect(adapter.isVersionLessThan('3.0.0', '3.0.0')).to.be.false;
        });

        it('returns true when major version is less', () => {
            expect(adapter.isVersionLessThan('2.9.9', '3.0.0')).to.be.true;
        });

        it('returns false when major version is greater', () => {
            expect(adapter.isVersionLessThan('4.0.0', '3.0.0')).to.be.false;
        });

        it('returns true when minor version is less', () => {
            expect(adapter.isVersionLessThan('3.1.9', '3.2.0')).to.be.true;
        });

        it('returns false when minor version is greater', () => {
            expect(adapter.isVersionLessThan('3.3.0', '3.2.0')).to.be.false;
        });

        it('returns true when patch version is less', () => {
            expect(adapter.isVersionLessThan('3.2.4', '3.2.5')).to.be.true;
        });

        it('returns false when patch version is greater', () => {
            expect(adapter.isVersionLessThan('3.2.6', '3.2.5')).to.be.false;
        });
    });

    // ─── _warnOnce ────────────────────────────────────────────────────────────

    describe('_warnOnce', () => {
        const KEY = 201; // DEVICE_BATTERY_DATA_MISSING

        let adapter;

        beforeEach(() => {
            adapter = createAdapter();
            adapter.warnings[KEY] = [];
        });

        it('logs a warning on first call', () => {
            adapter._warnOnce(KEY, 0, 'test warning');
            expect(adapter.log.warn).to.have.been.calledOnceWith('test warning');
        });

        it('does not log a warning on subsequent calls with the same index', () => {
            adapter._warnOnce(KEY, 0, 'test warning');
            adapter._warnOnce(KEY, 0, 'test warning');
            expect(adapter.log.warn).to.have.been.calledOnce;
        });

        it('logs independently for different indices', () => {
            adapter._warnOnce(KEY, 0, 'warning for 0');
            adapter._warnOnce(KEY, 1, 'warning for 1');
            expect(adapter.log.warn).to.have.been.calledTwice;
            expect(adapter.log.warn).to.have.been.calledWith('warning for 0');
            expect(adapter.log.warn).to.have.been.calledWith('warning for 1');
        });

        it('logs independently for different keys', () => {
            const OTHER_KEY = 202; // DEVICE_BATTERY_PERCENTAGE_DATA_MISSING
            adapter.warnings[OTHER_KEY] = [];
            adapter._warnOnce(KEY, 0, 'battery missing');
            adapter._warnOnce(OTHER_KEY, 0, 'battery percentage missing');
            expect(adapter.log.warn).to.have.been.calledTwice;
        });

        it('accepts a composite string index for device warnings', () => {
            adapter._warnOnce(KEY, '42_0', 'household 42, device 0');
            adapter._warnOnce(KEY, '42_0', 'household 42, device 0');
            adapter._warnOnce(KEY, '99_0', 'household 99, device 0');
            expect(adapter.log.warn).to.have.been.calledTwice;
            expect(adapter.log.warn).to.have.been.calledWith('household 42, device 0');
            expect(adapter.log.warn).to.have.been.calledWith('household 99, device 0');
        });

        it('logs again after the warning flag is reset', () => {
            adapter._warnOnce(KEY, 0, 'test warning');
            adapter.warnings[KEY][0] = false;
            adapter._warnOnce(KEY, 0, 'test warning');
            expect(adapter.log.warn).to.have.been.calledTwice;
        });
    });
});