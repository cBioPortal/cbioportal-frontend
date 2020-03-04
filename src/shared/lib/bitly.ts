import request from 'superagent';

export async function getBitlyShortenedUrl(
    url: string,
    bitlyAccessToken?: string | null
): Promise<string | undefined> {
    let bitlyResponse;

    // now lets shorten with bityly, if we have key
    // WE ARE DISABLING BITLY PENDING DISCUSSION
    if (bitlyAccessToken) {
        try {
            bitlyResponse = await request
                .post('https://api-ssl.bitly.com/v4/bitlinks')
                .send({
                    long_url: url,
                })
                .set({
                    Authorization: `Bearer ${bitlyAccessToken}`,
                });
        } catch (ex) {
            // fail silently.  we can just reutrn sessionUrl without shortening
        }
    }

    if (bitlyResponse && bitlyResponse.body && bitlyResponse.body.link) {
        return bitlyResponse.body.link as string;
    } else {
        return undefined;
    }
}
