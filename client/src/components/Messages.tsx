import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { memo, useEffect, useState, useRef } from "react"
import axios from "axios"
import { friendnameRecoil } from "@/atoms/friendname"
import { useRecoilState } from "recoil"


interface UserDetails {
  username: string;
  id: number;
  email: string
}

interface textType {
  message_val: string,
  id: number,
  sent_time: string,
  username: string,
  friendname: string,
  read:boolean
}

interface ContactComponentProps {
  setCurrentChat: React.Dispatch<React.SetStateAction<string>>;
  friendname: string;
  allmessagesofuser: textType[];
  currentChat:string;
  setAllmessagesofuser: React.Dispatch<React.SetStateAction<textType[]>>;
}

interface AllWebsocket {
  username: string | undefined,
  friendname: string,
  ws: WebSocket | null
}

interface MessageWindowProps {
  friendname: string;
  username: string | undefined;
  allwebsocket: AllWebsocket[];
  allmessagesofuser: textType[];
  setAllmessagesofuser: React.Dispatch<React.SetStateAction<textType[]>>;
}

interface MessageCompProp {
  username: string | undefined;
  friendname: string;
  textItem: textType
}


export const Messages = () => {
  const token = localStorage.getItem('token');
  //use that i scurrently loggged in
  const [user, setUser] = useState<UserDetails | null>(null);
  //current chat
  const [currentChat, setCurrentChat] = useState<string>('');
  //current contacts
  const [contacts, setContacts] = useState<string[]>([])
  //friendname to add friends
  const [friendname, setFriendname] = useState<string>('');
  const [websockets, setWebsockets] = useState<AllWebsocket[]>([]);
  const [allmessagesofuser, setAllmessagesofuser] = useState<textType[]>([]);
  const [friendnamerecoil,setFriendnameRecoil]=useRecoilState(friendnameRecoil)
  const [iserroractive,setIserroractive]=useState<boolean>(false);
  const [errorval,setErrorval]=useState<string>('');
  
  //function to verify token
  async function verifytoken(token: string | null) {
    try {
      const response = await axios.get("http://127.0.0.1:8000/test_token", {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,  // Use the variable for the token
        },
      })
      const data = await response.data
      return data
    }
    catch (error) {
      console.error('Error:', error);
    }
  }

  //function to run every time the token changes 
  useEffect(() => {
    async function fetchUser() {
      if (token) {
        const fetchedUser = await verifytoken(token);
        setUser(fetchedUser);
      }
    }
    fetchUser();
  }, [token]);


  

  const username = user?.username
  if (user?.email) {
    localStorage.setItem('email', user.email);
}
  useEffect(() => {
    async function getFriends() {
      const response = await axios.post("http://127.0.0.1:8000/message/getfriends/", {
        username: username
      })
      const friends = await response.data
      const newContacts = friends.map((friend: any) =>
        friend.username === username ? friend.friendname : friend.username
      );

      setContacts(newContacts);

      await getallmessages();

      for (const friend of friends) {
        //open websocket connection for every friend
        //fetch messages for each friend
        const roomname = friend.id;
        const friendname = friend.username === username ? friend.friendname : friend.username;
        const existingSocket = websockets.find(wsObj => wsObj.friendname === friendname)
        if (!existingSocket) {
          const ws = new WebSocket(
            'ws://'
            + '127.0.0.1:8000'
            + '/ws/message/'
            + roomname
            + '/'
          )
          setWebsockets((prev) => [
            ...prev,
            { username: username, friendname: friendname, ws: ws }
          ]);

          ws.onopen = () => console.log("ws opened" + roomname)

          ws.onclose = () => console.log("ws closed" + roomname)

          ws.onmessage = (e) => {
            console.log("hi")
            const data = JSON.parse(e.data);
            console.log(data)
            setAllmessagesofuser((prevTexts) => {
             
              return [...prevTexts, data];
              
            });
            
          };
        }
      }
    }

    async function getallmessages() {
      const response = await axios.post('http://127.0.0.1:8000/message/getmessages/', {
        username: username
      })
      const data = response.data
      setAllmessagesofuser([...allmessagesofuser, ...data]);
    }

    if (username) {
      getFriends();
    }
  }, [username])

  // useEffect(() => {
  //   if (allmessagesofuser.length > 0) {
  //     console.log("All messages have been loaded:", allmessagesofuser);
  //     // Perform other actions, like rendering or displaying the messages in the UI
  //   }
  // }, [allmessagesofuser]);


  async function addfriendfunc(newFriend: string) {
    try {
      console.log(newFriend);
      const response = await axios.post("http://127.0.0.1:8000/message/addfriend/", {
        "username": username,
        "friendname": newFriend
      })
      const data = response.data;
      if (data.hasOwnProperty('message')) {
        // console.log(data);
        setContacts([...contacts, newFriend])
        const friend = data.message;
        // console.log(friend);
        const roomname = friend.id;
        const ws = new WebSocket(
          'ws://'
          + '127.0.0.1:8000'
          + '/ws/message/'
          + roomname
          + '/'
        )
        setWebsockets([...websockets, {
          "username": username,
          "friendname": newFriend,
          "ws": ws
        }])

        ws.onopen = () => console.log("ws opened" + roomname)

        ws.onclose = () => console.log("ws closed" + roomname)

        ws.onmessage = (e) => {
          console.log("hi")
          const data = JSON.parse(e.data);
          console.log(data);
          setAllmessagesofuser((prevTexts) => {
            console.log("Received message:", data);
            
              return [...prevTexts, data];
            
          });
        };
        setIserroractive(false);
        setErrorval('');
      }
    } catch (e) {
     
      if (axios.isAxiosError(e) && e.response) {
        setIserroractive(true);
        setErrorval(e.response.data.error || "something went wrong");

      } else {
        setIserroractive(true);
        setErrorval("An unexpected error occurred");
        console.log(e);
      }
    }
    setFriendnameRecoil('');
  }


  useEffect(()=>{
    
    if(friendnamerecoil.length>0){
      addfriendfunc(friendnamerecoil);
    }
  },[friendnamerecoil])
  
  async function sendFriendRequest(){
    try{
      const response=await axios.post("http://127.0.0.1:8000/notification/addnotification/",{
        "username":username,
        "friendname":friendname,
        "notification_type":"friend_request",
        "notification_val":username+" sent you friend request"
      })
      const data=response.data;
      if(data.hasOwnProperty("message_success")){
        setIserroractive(false);
        setErrorval('');
      }
      else{
        setIserroractive(true);
        setErrorval(data.message);
      }
      setFriendname('');
      
    }catch (e){
      if (axios.isAxiosError(e) && e.response) {
        setIserroractive(true);
        setErrorval(e.response.data.message || "something went wrong");

      } else {
        setIserroractive(true);
        setErrorval("An unexpected error occurred");
        console.log(e);
      }
    }
  }


  return (
    <main className="h-screen bg-gradient-to-bl from-black to-gray-900 flex  text-white">
      <div className="sidebar bg-gradient-to-r from-black to-gray-950 w-[500px] border-r-[0.2px] border-white border-opacity-25">
        <h1 className="text-[28px] pt-10 px-6 ">My Friends</h1>
        <div className="flex  gap-3  items-center m-5 mb-5">
          <Input className="w-full rounded-[6px] p-5 border-opacity-25 hover:border-opacity-100" value={friendname} type="email" placeholder="Search for Users, Friends" onChange={(e) => {
            setFriendname(e.target.value);
          }} />
          <Button className="py-[20px] px-2 text-[16px] rounded-[6px]" type="button"  onClick={sendFriendRequest} >Send Friend Request</Button>
          {/* <Button className="py-[20px] px-2 text-[16px] rounded-[6px]" type="submit"><img src="search.svg" alt="" className="w-[30px]" /></Button> */}
        </div>
        

        {

           iserroractive ? <div className="text-red-500 text-sm" >{errorval}</div> : <></>

        }
        
        <ul className="contacts h-[70vh] w-full flex flex-col  items-center overflow-auto  ">
          {contacts.map(contact => {
            return <ContactComponent
              setCurrentChat={setCurrentChat}
              friendname={contact}
              key={contact} 
              allmessagesofuser={allmessagesofuser}
              currentChat={currentChat}
              setAllmessagesofuser={setAllmessagesofuser}
              />
          })}
          
        </ul>
      </div>
      <div className="messageScreen w-full">
        {(currentChat != '') ?
          <MessageWindow friendname={currentChat} username={username} allwebsocket={websockets} allmessagesofuser={allmessagesofuser} setAllmessagesofuser={setAllmessagesofuser} />
          :
          <div className="nouser w-full h-full flex justify-center items-center text-3xl">
            Select a Contact to Start Texting
          </div>
        }

      </div>
    </main>
  )
}

const ContactComponent = memo(function ContactComponent(props: ContactComponentProps) {
  const allmessagesofuser=props.allmessagesofuser;
  const [unread,setUnread]=useState<number>(0);
  const friendname=props.friendname;
  
  async function update_read(textItem:textType){
    const response=await axios.put("http://127.0.0.1:8000/message/readmessage/",{
       "message_id": textItem.id  
    })    
  }
  useEffect(() => {
    // When switching to another chat, mark messages as read for the current friend
    if (props.currentChat === friendname) {
      const unreadMessages = allmessagesofuser.filter(
        (message: textType) => message.username === friendname && message.read === false
      );
      
      // Mark these messages as read and update backend
      unreadMessages.forEach((message) => {
        update_read(message);
      });
      props.setAllmessagesofuser(
        allmessagesofuser.map((message: textType) => {
          if (message.username === friendname && message.read === false) {
            return {
              ...message,
              read: true, 
            };
          }
          return message; 
        })
      );
      setUnread(0);
    } else {
      // When the chat is not active, count only the unread messages
      const unreadMessages = allmessagesofuser.filter(
        (message: textType) => message.username === friendname && message.read === false
      );
      
      // Set the unread count
      setUnread(unreadMessages.length);
    }
  }, [friendname, allmessagesofuser.length,props.currentChat]);
  
  return (
    <li onClick={() => {
      props.setCurrentChat(props.friendname);
      setUnread(0);
    }} className="hover:bg-[#1f2229] w-full flex justify-center hover:cursor-pointer">
      {/* <div className="border-b-[0.5px] p-5 text-lg py-6 w-[90%] border-opacity-15 border-white">
        {props.friendname} {unread} 
      </div> */}
       <div className="border-b-[0.5px] p-5 text-lg py-6 w-[90%] border-opacity-15 border-white flex items-center justify-between">
      <span>{props.friendname}</span>
      {unread > 0 && (
        <span 
          className=" bg-cyan-800 text-white text-sm font-semibold px-2 py-1 rounded-full ml-2"
          style={{ minWidth: '24px', textAlign: 'center' }}
        >
          {unread}
        </span>
      )}
    </div>

    </li>
  )
})


const MessageWindow = memo(function MessageWindow(props: MessageWindowProps) {

  const [allTexts, setAllTexts] = useState<textType[]>([]);
  const [myTexts, setMyTexts] = useState<textType[]>([]);
  const [friendTexts, setFriendTexts] = useState<textType[]>([]);
  const username = props.username
  const friendname = props.friendname
  const allwebsockets = props.allwebsocket
  let wsRef = useRef<WebSocket | null>(null)
  const allmessagesofuser = props.allmessagesofuser
  // const setAllmessagesofuser = props.setAllmessagesofuser
  const [messageval, setMessageval] = useState<string>('');

  useEffect(() => {
    for (const websocket of allwebsockets) {
      if (websocket.friendname === friendname || websocket.username === friendname) {
        wsRef.current = websocket.ws;
        console.log("Assigned WebSocket for:", friendname);
      }
    }
  }, [friendname]); 


  useEffect(() => {
    // Filter my texts based on the conditions
    const filteredTexts = allmessagesofuser.filter((message: textType) =>
      message.username === friendname && message.friendname === username
    );
    setFriendTexts(filteredTexts);

    // Filter my texts based on the conditions
    const mySentMessages = allmessagesofuser.filter((message: textType) =>
      message.username === username && message.friendname === friendname
    );
    setMyTexts(mySentMessages);
  }, [allmessagesofuser,friendname]);

  // useEffect(() => {
    
  // }, [allmessagesofuser]);

  useEffect(() => {
    const combinedTexts = [...myTexts, ...friendTexts].sort((a, b) =>
      (a.sent_time > b.sent_time ? 1 : -1)
    );
    setAllTexts(combinedTexts);
  }, [myTexts, friendTexts,friendname]);

  // console.log(allTexts);
  // console.log(friendTexts);
  // console.log(myTexts);

  function addmessagefunc() {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        "username": username,
        "friendname": friendname,
        "message": messageval
      }))
    }
    setMessageval('');
  }
  const scrollref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    scrollref.current?.scrollTo(0, scrollref.current.scrollHeight);
  }, [allTexts])

  return (
    <div className="bg-gradient-to-bl from-gray-950 to-gray-800 h-full flex flex-col">
      <h1 className="h-[12%] bg-gradient-to-r from-black to-gray-950 flex items-center justify-center text-2xl border-white border-b-[0.5px] border-opacity-25 ">{friendname}</h1>
      <div ref={scrollref} className="h-[78%]  relative flex flex-col  p-8 z-10 overflow-auto ">
        {allTexts.map((textItem) => (
          <MessageComp key={textItem.id} textItem={textItem} username={username} friendname={friendname} />
        ))}
      </div>
      <div className="h-[10%] bg-gradient-to-b  from-gray-950 to-gray-950 p-2 flex items-center justify-center text-2xl border-white border-t-[0.5px] border-opacity-25">
        <div className="flex w-[95%] gap-3 items-center justify-center">
          <Input className="w-full bg-[#171e28] rounded-[6px] p-5 border-opacity-25 hover:border-opacity-100" type="text" placeholder="Enter Message" value={messageval} onChange={(e) => { setMessageval(e.target.value) }} onKeyDown={(e)=>{
            if(e.key === 'Enter'){
              addmessagefunc()
            }
          }} />
          <Button className="py-[20px] px-2 text-[16px] rounded-[6px]" type="button" onClick={addmessagefunc} ><img src="send.svg" alt="" className="w-[30px]" /></Button>
        </div>
      </div>

    </div>
  )
})

const MessageComp = memo(function messageComp(props: MessageCompProp) {

  const username = props.username
  const textItem = props.textItem
  return (
    <>
      {
        //usertext
        textItem.username === username
          ?
          <div className=" p-2 flex justify-end ">
            <div className="max-w-[60%] bg-cyan-800 rounded-xl  p-3 px-7">
              {textItem.message_val}
            </div>

          </div>
          :
          //friendtext
          <div className=" p-2 flex justify-start ">
            <div className="max-w-[60%] bg-cyan-950 rounded-xl  p-3 px-7">
              {textItem.message_val}
            </div>

          </div>
      }

    </>
  )
})