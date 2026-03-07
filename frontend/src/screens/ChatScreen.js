import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { db, auth } from '../config/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { Send, ChevronLeft, ShieldCheck } from 'lucide-react-native';

export default function ChatScreen({ route, navigation }) {
    const { conversationId, receiverId } = route.params || {};
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef();

    const currentUid = auth.currentUser?.uid;

    // Determine the actual conversation ID if only receiverId is provided
    const actualConvoId = conversationId || [currentUid, receiverId].sort().join('_');
    const actualReceiverId = receiverId || actualConvoId.split('_').find(id => id !== currentUid);

    useEffect(() => {
        if (!currentUid) return;

        const msgsRef = collection(db, 'conversations', actualConvoId, 'messages');
        const q = query(msgsRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setMessages(fetchedMessages);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [actualConvoId]);

    const handleSendMessage = async () => {
        if (inputText.trim() === '') return;

        const textToSend = inputText.trim();
        setInputText('');

        try {
            const message = {
                senderId: currentUid,
                receiverId: actualReceiverId,
                text: textToSend,
                timestamp: serverTimestamp(),
                read: false
            };

            // Add the message to the conversation sub-collection
            await addDoc(collection(db, 'conversations', actualConvoId, 'messages'), message);

            // Update the conversation's main document metadata
            await setDoc(doc(db, 'conversations', actualConvoId), {
                lastMessage: textToSend,
                lastUpdate: serverTimestamp(),
                participants: [currentUid, actualReceiverId]
            }, { merge: true });

        } catch (error) {
            console.error('Send Error:', error);
        }
    };

    const renderMessage = ({ item }) => {
        const isMe = item.senderId === currentUid;
        return (
            <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
                <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>{item.text}</Text>
                {item.timestamp && (
                    <Text style={[styles.timeText, isMe ? styles.myTime : styles.theirTime]}>
                        {new Date(item.timestamp?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                )}
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{route.params?.userName || 'Support Chat'}</Text>
                    <View style={styles.secureBadge}>
                        <ShieldCheck color={COLORS.success} size={12} />
                        <Text style={styles.secureText}>End-to-end Encrypted</Text>
                    </View>
                </View>
                <View style={{ width: 44 }} />
            </View>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={[styles.list, { paddingBottom: 20 }]}
                    onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
                />
            )}

            <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    placeholderTextColor="#666"
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
                    onPress={handleSendMessage}
                    disabled={!inputText.trim()}
                >
                    <Send color="#fff" size={20} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#222'
    },
    backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    headerInfo: { alignItems: 'center' },
    headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
    secureBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    secureText: { color: COLORS.success, fontSize: 10, fontWeight: 'bold' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 20 },
    messageBubble: {
        padding: 12,
        borderRadius: 18,
        marginBottom: 10,
        maxWidth: '80%',
        elevation: 1
    },
    myBubble: {
        alignSelf: 'flex-end',
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4
    },
    theirBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#262626',
        borderBottomLeftRadius: 4
    },
    messageText: { fontSize: 15, lineHeight: 20 },
    myText: { color: COLORS.background },
    theirText: { color: COLORS.text },
    timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    myTime: { color: COLORS.background + '80' },
    theirTime: { color: COLORS.textSecondary },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#1a1a1a',
        borderTopWidth: 1,
        borderTopColor: '#222'
    },
    input: {
        flex: 1,
        backgroundColor: '#262626',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 10,
        color: COLORS.text,
        fontSize: 15,
        maxHeight: 120
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10
    }
});
