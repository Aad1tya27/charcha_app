import { useEffect, useState, useRef, memo } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom';

type CategoryType = {
    id: number,
    category_name: string,
    postId: number
}

type PostInputs = {
    username: string,
    post_val: string,
    sent_time: string,
    id: number,
    heading: string,
    likes: number,
    allCategories: CategoryType[]
}

interface UserDetails {
    username: string;
    id: number;
    email: string
}


export const Posts = () => {
    const [user, setUser] = useState<UserDetails>({
        username: '',
        id: 0,
        email: ''
    })
    const wsRef = useRef<WebSocket | null>(null)

    const [allCategories, setAllCategories] = useState<CategoryType[]>([])
    const [posts, setPosts] = useState<PostInputs[]>([])
    const [addPostActive, setAddPostActive] = useState<boolean>(false)
    const [postval, setPostVal] = useState<string>('');
    const [heading, setHeading] = useState<string>('');
    const [topic, setTopic] = useState<string>('');
    const [errorActive, setErrorActive] = useState(false)
    const [allUsers, setAllUsers] = useState<UserDetails[]>([])


    async function getPosts() {
        const res = await axios.get('http://127.0.0.1:8000/posts/posts/')
        const resPosts = res.data;
        setPosts(resPosts.posts)
        setPosts((p) => {
            return p.sort((a, b) =>
                a.sent_time < b.sent_time ? 1 : -1
            )
        })
    }
    async function getCategories() {
        const res = await axios.get('http://127.0.0.1:8000/posts/categories/')
        const resCat = res.data;
        // console.log(resCat.categories)
        setAllCategories(()=>{
            const categories = resCat.categories || []
            console.log(categories)
            return categories
        })
    }

    async function getUsers() {
        const res = await axios.get('http://127.0.0.1:8000/users/')
        const resCat = res.data;
        // console.log(resCat.categories)
        setAllUsers(()=>{
            return resCat.users
        })
    }

    function submitfunc(event: React.FormEvent) {
        event.preventDefault()
        if (postval.length === 0 || heading.length === 0 || topic.length === 0) {
            setErrorActive(true)
            setTimeout(() => {
                setErrorActive(false)
            }, 2000);

        } else {
            // console.log(postval, heading)
            if (wsRef.current) {
                wsRef.current.send(JSON.stringify({
                    'heading': heading,
                    'post': postval,
                    'username': user.username,
                    'category': topic
                }));
            }
            // setPosts([...posts, { message: data.message }])
            setAddPostActive(false)
            setPostVal('');
            setErrorActive(false)
            setHeading('')
            setTopic('')
        }


    }

    useEffect(() => {
        async function verifytoken(token: string | null) {
            let userInfo;
            try {
                const response = await axios.get("http://127.0.0.1:8000/test_token/", {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`,  // Use the variable for the token
                    },
                })
                const data: UserDetails = await response.data
                userInfo = data
            }
            catch (error) {
                console.error('Error:', error);
                userInfo = {
                    username: '',
                    id: 0,
                    email: ''
                }
            }
            console.log(userInfo)
            setUser(userInfo)
        }
        verifytoken(localStorage.getItem('token'))
        getPosts()
        getCategories()
        getUsers()
    }, [])



    useEffect(() => {
        // console.log(user, "wow")
        if (user.username.length > 0) {
            wsRef.current = new WebSocket(
                'ws://'
                + '127.0.0.1:8000'
                + '/ws/posts/public/'
            )


            wsRef.current.onopen = () => console.log("ws opened")

            wsRef.current.onclose = () => console.log("ws closed")

            wsRef.current.onmessage = async (e) => {
                const data = JSON.parse(e.data)
                console.log(allCategories, "hello before")
                setAllCategories((prevCategories) => {
                    const newCategories = data.categories || [];
                    const updatedCategories = [
                        ...prevCategories,
                        ...newCategories.filter(
                            (newCat: CategoryType) => !prevCategories.some((cat) => cat.id === newCat.id)
                        ),
                    ];
                    console.log(updatedCategories, "hello after update");
                    return updatedCategories;
                });
                // if(allCategories.length > 0){
                //     setAllCategories([...allCategories, ...data.categories])
                // }else{
                //     setAllCategories([...data.categories])
                // }
                setPosts((p) => {
                    return [...p, data].sort((a, b) =>
                        a.sent_time < b.sent_time ? 1 : -1
                    )
                })

            }
        }


        return () => {
            if (wsRef.current) {
                wsRef.current.close()
            }
        }
    }, [user])




    return (
        <>

            <main className="h-screen bg-gradient-to-b from-black to-gray-950 font-semibold flex flex-col  items-center text-white">
                <div className=" text-3xl mt-16 ">Share Your Thoughts and Ideas with the Community!</div>
                <div className="flex flex-col justify-around bg-gradient-to-b from-black to-gray-800 w-full  h-full items-center">
                    <div className="flex  gap-5  m-4 my-8">
                        {/* <h1 className='text-2xl'>Filter by:</h1> */}
                        <div className="user flex items-center gap-4">
                            {/* <label htmlFor="user">User:</label> */}
                            <select name='user' id='user' className='  bg-black p-2  border-[0.1px] rounded-[5px] border-opacity-25 border-white ' defaultValue={"-"}>
                                <option value="-" disabled>Filter By Username</option>
                                <option value="None">All Users</option>
                                {
                                    allUsers.length ?
                                        (allUsers.map((userElement) => {
                                            return <option key={userElement.id} value={userElement.username}>{userElement.username}</option>
                                        }))
                                        :
                                        (
                                            <option value="loading" disabled>Loading categories...</option>
                                        )
                                }
                            </select>
                        </div>
                        <div className="category flex items-center gap-4">
                            {/* <label htmlFor="category">Category</label> */}
                            <select name='category' id='category' className='  bg-black p-2  border-[0.1px] rounded-[5px] border-opacity-25 border-white' defaultValue={"-"}>
                                <option  value="-" disabled>Filter By Categories</option>
                                <option className='font-medium' value="None">All Categories</option>
                                {
                                    allCategories.length ?
                                        (allCategories.map((category) => {
                                            return <option key={category.id} value={category.category_name}>{category.category_name}</option>
                                        }))
                                        :
                                        (
                                            <option value="loading" disabled>Loading categories...</option>
                                        )
                                }
                                {/* <option value="entertainment">Entertainment</option>
                                <option value="sports">Sports</option>
                                <option value="science">Science</option> */}
                            </select>
                            {/* <input type="text" placeholder='Enter Category' className='bg-black p-2  border-[0.1px] rounded-[5px] border-opacity-25 border-white' /> */}
                        </div>
                        <div className="calendar flex items-center gap-4">
                            {/* <label htmlFor="date">Date:</label> */}
                            <input className='bg-white p-[5px]  border-[0.1px] rounded-[5px] border-opacity-25 text-black border-white' type="date" id="date" name="date" />
                        </div>

                    </div>
                    <div className="messages w-[65%] h-[70vh] ">
                        <ul className="font-normal flex flex-col p-2 items-center gap-5 overflow-auto h-[70vh] ">

                            {posts.length ?
                                posts.map(post => {
                                    // let categories = allCategories.filter((category) => {
                                    //     if (category.postId == post.id) return category
                                    // })
                                    return (
                                        <div key={post.id}>
                                            <div className='p-2 font-medium'>{post.sent_time.slice(0, 10)}</div>
                                            <PostComponent
                                                allCategories={allCategories}
                                                likes={post.likes}
                                                id={post.id}
                                                heading={post.heading}
                                                username={post.username}
                                                sent_time={post.sent_time}
                                                post_val={post.post_val} />
                                        </div>
                                    )
                                }) :
                                <></>
                            }
                            {/* <PostComponent message={"Lorem ipsum dolor sit amet consectetur adipisicing elit. Non impedit debitis libero illum asperiores adipisci repellendus ipsum hic corporis commodi."} /> */}
                        </ul>
                    </div>
                    <button onClick={() => {
                        setAddPostActive(true)

                    }} className='addPost flex items-center justify-center fixed bottom-0 right-0 m-8 w-[60px] h-[60px] rounded-[15px] overflow-hidden border-[4px] border-black opacity-80 '>
                        <img className='scale-125' src="post.png" alt="" />
                    </button>

                </div>
            </main>

            {
                addPostActive
                &&
                <div className="addPost top-0 left-0 fixed z-10 flex justify-center items-center h-screen w-screen bg-black bg-opacity-70 ">

                    <div className='bg-[#242424] relative  w-[40%] rounded-xl flex justify-center items-center border border-gray-700 p-6'>
                        <div className="cross absolute top-0 right-0" onClick={() => {
                            setAddPostActive(false)
                        }}>
                            <img src="icons8-cross-96.png " className='w-[20px] m-2 cursor-pointer' alt="" />
                        </div>
                        <form className='w-[90%]  flex flex-col justify-around  items-center' >
                            <label htmlFor='message' className='text-white self-start font-medium p-1 '>Title</label>
                            <input onChange={(e) => {
                                setHeading(e.target.value);
                            }} type='text' className='bg-[#151515] border border-white border-opacity-20 rounded-[10px]  w-full p-2 px-4 mb-2  text-white ' placeholder='Enter Title here' name="title" id="title" />
                            <label htmlFor='message' className='text-white self-start font-medium p-1 '>Description</label>
                            <textarea onChange={(e) => {
                                setPostVal(e.target.value);
                            }} className='bg-[#151515] border border-white border-opacity-20 rounded-[10px] h-[200px] w-full p-4 mb-2  text-white ' placeholder='Express your thoughts here...' name="message" id="message" />
                            <div className="topic flex items-center justify-center gap-2 m-2 w-full">
                                <label htmlFor='category' className='text-white block font-medium p-1 '>Keywords: </label>
                                <div className='w-[70%]'>
                                    <input onChange={(e) => {
                                        setTopic(e.target.value);
                                    }} type='text' className='bg-[#151515] text-md block border border-white border-opacity-20 w-full rounded-[10px] p-2 px-4  text-white ' placeholder='Enter Space Separated Keywords' name="category" id="category" />
                                </div>
                            </div>
                            {errorActive && <div className=' text-red-600 text-sm'>One of the fields is Empty!</div>}
                            <button type='button' className='bg-[#757575]  text-white p-3 px-5 m-2 rounded-[5px]' onClick={submitfunc} >Publish</button>
                        </form>
                    </div>
                </div>
            }


        </>
    )
}


const PostComponent = memo(function PostComponent(props: PostInputs) {
    const [postLikes, setPostLikes] = useState<number>(props.likes)
    const [heartUrl, setHeartUrl] = useState("notliked.png")
    const [categories, setCategories] = useState<CategoryType[]>([])
    useEffect(() => {
        async function checkLike() {
            const res = await axios.get(`http://127.0.0.1:8000/posts/like/`, {
                params: {
                    username: localStorage.getItem('username'),
                    postId: props.id,
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${localStorage.getItem('token')}`
                }
            })
            // console.log(res.data.message, props.id)
            if (res.data.message === "Liked") {
                setHeartUrl('liked.png')
            } else {
                setHeartUrl('notliked.png')
            }
        }
        checkLike()
    }, [])

    useEffect(() => {
        let filteredCategories = props.allCategories.filter((category) => {
            if (category.postId === props.id) return category
        })

        setCategories(filteredCategories)

    }, [props.allCategories])

    // Example usage
    function convertToIST(time: string) {
        const [hour, minute] = time.split(':').map(Number);

        // Create a Date object for the current date in UTC
        const date = new Date();
        date.setUTCHours(hour, minute);

        // Add 5 hours and 30 minutes for IST
        date.setMinutes(date.getMinutes() + 330);

        // Format the new time in HH:MM format
        const istHour = date.getUTCHours().toString().padStart(2, '0');
        const istMinute = date.getUTCMinutes().toString().padStart(2, '0');

        return `${istHour}:${istMinute}`;
    }

    async function toggleLike() {
        if (heartUrl === "notliked.png") {
            setHeartUrl("liked.png")
            setPostLikes(postLikes + 1)
            await axios.post(`http://127.0.0.1:8000/posts/like/`,
                {
                    username: localStorage.getItem('username'),
                    postId: props.id,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${localStorage.getItem('token')}`
                    }
                })
        } else {
            setHeartUrl("notliked.png")
            setPostLikes(postLikes - 1)
            await axios.delete(`http://127.0.0.1:8000/posts/like/`, {
                params: {
                    username: localStorage.getItem('username'),
                    postId: props.id,
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${localStorage.getItem('token')}`
                }
            })
        }
    }

    return (
        <li className=" rounded-[8px] w-full relative  flex flex-col items-center p-5 border border-white border-opacity-10 hover:border-opacity-75">
            {/* <div className="heading flex justify-between"> */}
            <div className="user absolute top-0 left-0 m-[30px]">By {props.username},</div>
            <div className="date absolute top-0 right-0 m-6  flex gap-2 items-center">
                {
                    categories.length ?
                        categories.map(category => {
                            return <div key={category.id} className='bg-gray-800 p-1 px-3 rounded-2xl'>{category.category_name}</div>
                        })
                        :
                        <></>
                }
                {convertToIST((props.sent_time).slice(11, 16))} Hrs
            </div>
            {/* </div> */}
            <h1 className='text-center text-[28px] mt-8 pt-4 font-medium'> {props.heading} </h1>
            <div className="content m-12 mt-6 p-5 w-full ">
                {props.post_val} Lorem ipsum dolor sit amet, consectetur adipisicing elit. Inventore nostrum, magni magnam voluptates repellendus, eos a ab voluptas repudiandae sed perspiciatis. Placeat, saepe neque. Adipisci rem doloremque iste, quasi laborum sunt eligendi beatae alias praesentium nesciunt, temporibus consequuntur quam voluptatem maxime? Architecto expedita iste nostrum, eius nisi eaque incidunt temporibus accusantium, eum iusto amet quod deserunt quo libero ipsum quas, vel eos ducimus facilis possimus. Reprehenderit, eos ab consectetur aperiam itaque fugit facilis praesentium possimus ipsam, commodi eum quia dolorem perferendis nisi voluptatibus in voluptates? Ad, pariatur delectus tenetur excepturi totam perspiciatis magni asperiores corrupti ipsum omnis id, temporibus maiores.
            </div>
            <div className="info absolute right-0 items-center justify-center bottom-0 m-4 flex gap-2">
                {postLikes}
                <div onClick={toggleLike} className='w-[22px] cursor-pointer'>
                    <img src={heartUrl} alt="" />
                </div>
            </div>
            <Link to={"/posts/" + props.id.toString()} className="info absolute left-0 bottom-0 m-6 w-[25px] flex gap-2">
                <img src="icons8-comment-96.png" alt="" />
            </Link>
        </li>
    )
})