
import mongoose from 'mongoose';
import User from './src/models/User.js';
import Conversation from './src/models/Conversation.js';
import Message from './src/models/Message.js';
import Friend from './src/models/Friend.js';
import FriendRequest from './src/models/FriendRequest.js';
import { sendMessage, getConversations } from './src/controllers/messageController.js';
import { acceptFriendRequest, sendFriendRequest } from './src/controllers/friendController.js';

// Mock request/response
const mockReq = (user, body = {}, query = {}, params = {}) => ({
	user,
	body,
	query,
	params,
	file: null
});

const mockRes = () => {
	const res = {};
	res.status = (code) => {
		res.statusCode = code;
		return res;
	};
	res.json = (data) => {
		res.data = data;
		return res;
	};
	return res;
};

// Connect to DB (assuming local or using env)
// Note: This script assumes running in backend env with access to models
// We might need to adjust imports if running from root or strict ESM.
// Current directory: c:\Users\acer\codeSpace\Chatz\backend

// !!! IMPORTANT: Adjust connection string as needed !!!
const MONGO_URI = 'mongodb://127.0.0.1:27017/chatz_test_pending';

async function runTest() {
	try {
		await mongoose.connect(MONGO_URI);
		console.log('Connected to DB');

		// Cleanup
		await User.deleteMany({});
		await Conversation.deleteMany({});
		await Message.deleteMany({});
		await Friend.deleteMany({});
		await FriendRequest.deleteMany({});

		// Create Users
		const userA = await User.create({ username: 'userA', email: 'a@test.com', password: 'p', firstname: 'A', lastname: 'User' });
		const userB = await User.create({ username: 'userB', email: 'b@test.com', password: 'p', firstname: 'B', lastname: 'User' });

		console.log('Users created:', userA._id, userB._id);

		// 1. User A sends message to User B (Not friends)
		console.log('\n--- Test 1: A sends to B (Not Friends) ---');
		const req1 = mockReq(userA, { recipientId: userB._id, content: 'Hello B from A' });
		const res1 = mockRes();
		await sendMessage(req1, res1);
		console.log('Send Message Status:', res1.statusCode);

		// Verify Conversation
		const convo1 = await Conversation.findOne({});
		console.log('Conversation created:', convo1._id, 'Pending:', convo1.isPending, 'Receiver:', convo1.pendingReceiver);

		if (convo1.isPending && convo1.pendingReceiver.toString() === userB._id.toString()) {
			console.log('PASS: Conversation is pending for B');
		} else {
			console.log('FAIL: Conversation should be pending for B');
		}

		// 2. User B checks Main Inbox
		console.log('\n--- Test 2: B checks Main Inbox ---');
		const req2 = mockReq(userB, {}, { type: 'main' });
		const res2 = mockRes();
		await getConversations(req2, res2);
		const mainConvos = res2.data;
		console.log('B Main Inbox count:', mainConvos.length);
		if (mainConvos.length === 0) console.log('PASS: B sees 0 in main');
		else console.log('FAIL: B should see 0 in main');

		// 3. User B checks Pending Inbox
		console.log('\n--- Test 3: B checks Pending Inbox ---');
		const req3 = mockReq(userB, {}, { type: 'pending' });
		const res3 = mockRes();
		await getConversations(req3, res3);
		const pendingConvos = res3.data;
		console.log('B Pending Inbox count:', pendingConvos.length);
		if (pendingConvos.length === 1) console.log('PASS: B sees 1 in pending');
		else console.log('FAIL: B should see 1 in pending');

		// 4. User A checks Main Inbox
		console.log('\n--- Test 4: A checks Main Inbox ---');
		const req4 = mockReq(userA, {}, { type: 'main' });
		const res4 = mockRes();
		await getConversations(req4, res4);
		const aConvos = res4.data;
		console.log('A Main Inbox count:', aConvos.length);
		if (aConvos.length === 1) console.log('PASS: A sees 1 in main');
		else console.log('FAIL: A should see 1 in main');

		// 5. User A replies (should verify it stays pending for B) - logic change: A replying shouldn't accept it for B.
		// My logic: `if (conversation.isPending && conversation.pendingReceiver && conversation.pendingReceiver.toString() === senderId.toString())`
		// A is sender. A is NOT pendingReceiver. So no change. Correct.

		// 6. User B replies (should ACCEPT it)
		console.log('\n--- Test 6: B replies (Should Accept) ---');
		const req6 = mockReq(userB, { conversationId: convo1._id, content: 'Hi A, accepting.' });
		const res6 = mockRes();
		await sendMessage(req6, res6);
		console.log('Reply Status:', res6.statusCode);

		const convo2 = await Conversation.findById(convo1._id);
		console.log('Conversation Pending:', convo2.isPending);
		if (!convo2.isPending && !convo2.pendingReceiver) console.log('PASS: Conversation no longer pending');
		else console.log('FAIL: Conversation should not be pending');

		// 7. Verify logic: Make friends -> Clear Pending
		console.log('\n--- Test 7: Friend Request clears Pending ---');
		// Reset
		await Conversation.deleteMany({});
		await Message.deleteMany({});
		// A sends to B (Pending)
		await sendMessage(mockReq(userA, { recipientId: userB._id, content: 'Pending again' }), mockRes());
		const convo3 = await Conversation.findOne({});
		console.log('Convo3 Pending:', convo3.isPending); // Should be true

		// A sends friend request to B
		await sendFriendRequest(mockReq(userA, { to: userB._id }), mockRes());
		const reqId = (await FriendRequest.findOne({}))._id;

		// B accepts friend request
		// First we need to mock parameters for req.params
		const req7 = mockReq(userB, {}, {}, { requestId: reqId });
		const res7 = mockRes();
		await acceptFriendRequest(req7, res7);
		console.log('Accept Friend Status:', res7.statusCode);

		const convo4 = await Conversation.findById(convo3._id);
		console.log('Convo4 Pending:', convo4.isPending);
		if (!convo4.isPending) console.log('PASS: Friend acceptance cleared pending');
		else console.log('FAIL: Friend acceptance did not clear pending');


	} catch (e) {
		console.error(e);
	} finally {
		await mongoose.disconnect();
	}
}

runTest();
