"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import "../forms.css";
import "../dashboard.css";


interface Caregiver {

id:string;

name:string|null;

phone:string|null;

address:string|null;

career_years:number|null;

certificate:string|null;

hourly_rate:number|null;

specialty:string|null;

available:boolean|null;

}




export default function CaregiversPage(){


const [caregivers,setCaregivers]
=
useState<Caregiver[]>([]);


const [keyword,setKeyword]
=
useState("");


const [loading,setLoading]
=
useState(true);


const [message,setMessage]
=
useState("");





async function loadCaregivers(){


const {data,error}
=
await supabase
.from("caregivers")
.select(
`
id,
name,
phone,
address,
career_years,
certificate,
hourly_rate,
specialty,
available
`
)
.order(
"created_at",
{
ascending:false
}
);



if(error){

setMessage(error.message);

setLoading(false);

return;

}



if(data){

setCaregivers(data);

}



setLoading(false);


}





useEffect(()=>{

loadCaregivers();

},[]);





const filteredCaregivers =
caregivers.filter((item)=>{


const text =

`${item.name || ""}
${item.address || ""}
${item.specialty || ""}
`
.toLowerCase();



return text.includes(
keyword.toLowerCase()
);


});








if(loading){


return (

<main className="authPage">

<p className="loadingText">
간병인 정보를 불러오는 중입니다...
</p>

</main>

);


}





return (


<main className="dashboardPage">





<header className="dashboardHeader">


<a
className="brand"
href="/"
>


<span className="brandMark">
C
</span>


<span>
케어택
</span>


</a>




<div className="headerActions">


<a
className="textButton"
href="/mypage"
>
마이페이지
</a>



<a
className="textButton"
href="/care-request"
>
간병 신청
</a>



</div>


</header>







<section className="dashboardHero">


<span className="eyebrow">
CAREGIVERS
</span>



<h1>

검증된 간병인 찾기

</h1>



<p>

케어택 등록 간병인의 경력과 전문 분야를 확인하세요.

</p>


</section>









<section className="dashboardSection">



<div className="dashboardTitle">


<h2>
간병인 목록
</h2>


</div>





<div className="formGroup">


<input

value={keyword}

onChange={(e)=>
setKeyword(e.target.value)
}

placeholder="지역, 이름, 전문분야 검색"

/>


</div>







{

filteredCaregivers.length===0


?


<div className="emptyState">

조건에 맞는 간병인이 없습니다.

</div>



:


<div className="assignmentGrid">



{

filteredCaregivers.map((caregiver)=>(



<article

key={caregiver.id}

className="assignedCaregiverCard"

>



<div className="assignedCardTop">



<div className="caregiverAvatar">


{
caregiver.name?.slice(0,1)
||
"간"
}


</div>





<div>


<h3>

{
caregiver.name
||
"간병인"
}

</h3>



<p>

{
caregiver.specialty
||
"일반 간병"

}

</p>


</div>




</div>







<dl className="assignmentDetails">



<div>

<dt>
활동 지역
</dt>


<dd>

{
caregiver.address
||
"-"
}

</dd>


</div>





<div>

<dt>
경력
</dt>


<dd>

{
caregiver.career_years
||
0
}

년

</dd>


</div>





<div>

<dt>
자격증
</dt>


<dd>

{
caregiver.certificate
||
"등록 정보 없음"
}

</dd>


</div>





<div>

<dt>
희망 시급
</dt>


<dd>

{

caregiver.hourly_rate

?

`${caregiver.hourly_rate.toLocaleString()}원`

:

"협의"

}

</dd>


</div>






<div>

<dt>
가능 여부
</dt>


<dd>

{

caregiver.available

?

"🟢 즉시 가능"

:

"상담 필요"

}

</dd>


</div>




</dl>







<a

className="smallPrimary"

href={`/care-request?caregiver=${caregiver.id}`}

>

매칭 요청

</a>





</article>



))


}



</div>


}





</section>







{

message &&

<p className="formMessage error">

{message}

</p>

}





</main>


);


}



