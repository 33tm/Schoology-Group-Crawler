import { api, token } from "./config.js"
import { readFile, writeFile } from "fs/promises"
import OAuth from "oauth-1.0a"
import crypto from "crypto"

const log = data => console.log(`[${new Date(Date.now()).toLocaleString()}] ${data}`)

const { ignore, success } = {
	ignore: await readFile("out/ignore.txt", "utf8").then(data => data.split("\n")),
	sucess: await readFile("out/success.txt", "utf8").then(data => data.split("\n"))
}

const oauth = new OAuth({
	consumer: api,
	signature_method: "HMAC-SHA1",
	hash_function: (base, key) => crypto
		.createHmac("sha1", key)
		.update(base)
		.digest("base64")
})

const schoology = async (path) => {
	const url = `https://api.schoology.com/v1${path}`
	return await fetch(url, { headers: { ...oauth.toHeader(oauth.authorize({ url, method: "GET" }, token)) } }).then(res => res.json())
}

const checkNested = async input => {
	const temp = []
	const { group, links } = input
	temp.push(group.map(group => group.id))
	links.next && temp.push(await checkNested(await schoology(links.next.split("v1")[1] + "0")))
	return temp.flat()
}

const getUserGroups = async uid => {
	const groups = []
	groups.push(await checkNested(await schoology(`/users/${uid}/groups`)))
	return groups.flat()
}

const getSchoolGroups = async school => {
	const groups = []
	groups.push(await checkNested(await schoology(`/schools/${school}/groups`)))
	return groups.flat()
}

await getUserGroups(13225459).then(res => console.log(res.length))

// ignore groups i'm already in
// ignore groups already checked
// check recent posts and likes, check people who liked those posts and the groups they're in
// check pepople in groups i'm in and the groups they're in

// get groups i'm in

