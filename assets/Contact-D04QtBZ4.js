import{S as e,T as t,c as n,f as r,i,s as a,t as o,v as s,y as c}from"./index-CFv2s97d.js";
import{n as l,t as u}from"./KineticText-2ugwzcLC.js";
import{t as d}from"./Magnetic-MO2-WKWP.js";

var f=t(e(),1),p=c(),m=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,h=10,g=2e3;

function _({name:e,email:t,message:n}){
  let r={};
  return e.trim()||(r.name="Please tell me your name."),
         m.test(t.trim())||(r.email="That email address doesn't look right."),
         n.trim().length<h&&(r.message="A few more words, please (at least "+h+" characters)."),
         n.length>g&&(r.message="Please keep it under "+g+" characters."),
         r;
}

function y(){
  let e=a.contact,
      {reduced:t,webgl:c}=s(),
      [val,setVal]=(0,f.useState)({name:"",email:"",message:""}),
      [errs,setErrs]=(0,f.useState)({}),
      [announcement,setAnnouncement]=(0,f.useState)(""),
      [isSubmitted,setIsSubmitted]=(0,f.useState)(!1),
      [isSending,setIsSending]=(0,f.useState)(!1),
      [serverError,setServerError]=(0,f.useState)(""),
      formRef=(0,f.useRef)(null),
      onChange=ev=>{
        let k=ev.target.name, v=ev.target.value;
        setVal(prev=>({...prev,[k]:v}));
        errs[k]&&setErrs(prev=>({...prev,[k]:void 0}));
      },
      onSubmit=async ev=>{
        ev.preventDefault();
        if(isSending)return;
        let vErrs=_(val);
        setErrs(vErrs);
        let firstErrKey=Object.keys(vErrs)[0];
        if(firstErrKey){
          setAnnouncement("Please fix the highlighted field.");
          formRef.current.querySelector("[name=\""+firstErrKey+"\"]")?.focus();
          return;
        }
        setIsSending(!0);
        setServerError("");
        setAnnouncement("Sending your message...");
        try{
          let res=await fetch("/api/contact",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(val)
          });
          let resData=await res.json().catch(()=>({}));
          if(res.ok&&resData.ok){
            r.set({planeLaunches:r.get().planeLaunches+1});
            setIsSubmitted(!0);
            setAnnouncement(e.thanks);
            setVal({name:"",email:"",message:""});
          }else{
            let msg=resData.error||resData.detail||"Unable to send message right now. Please try again or email akesurekha@gmail.com directly.";
            setServerError(msg);
            setAnnouncement(msg);
          }
        }catch(netErr){
          let msg="Unable to reach the server right now. Please check your connection or email akesurekha@gmail.com directly.";
          setServerError(msg);
          setAnnouncement(msg);
        }finally{
          setIsSending(!1);
        }
      },
      onReset=()=>{
        setVal({name:"",email:"",message:""});
        setIsSubmitted(!1);
        setAnnouncement("");
        setServerError("");
      },
      renderField=(fName,fLabel,opts={})=>{
        let Comp=opts.multiline?"textarea":"input",
            {multiline:_,...inputProps}=opts;
        return (0,p.jsxs)("div",{
          className:"field "+(errs[fName]?"has-error":""),
          children:[
            (0,p.jsx)("label",{htmlFor:"f-"+fName,children:fLabel}),
            (0,p.jsx)(Comp,{
              id:"f-"+fName,
              name:fName,
              value:val[fName],
              onChange:onChange,
              disabled:isSending,
              "aria-invalid":!!errs[fName],
              "aria-describedby":errs[fName]?"e-"+fName:void 0,
              ...inputProps
            }),
            errs[fName]&&(0,p.jsx)("p",{className:"field__error",id:"e-"+fName,children:errs[fName]})
          ]
        });
      };

  return (0,p.jsx)(l,{
    title:n[4].title,
    className:"page--contact",
    children:(0,p.jsxs)("section",{
      className:"contact wrap",
      children:[
        (0,p.jsxs)("div",{
          className:"contact__intro",
          children:[
            (0,p.jsx)(u,{as:"p",variant:"scramble",trigger:"ready",className:"kicker",children:e.kicker}),
            (0,p.jsx)("h1",{id:"page-title",tabIndex:-1,className:"contact__title",children:(0,p.jsx)(u,{trigger:"ready",delay:.15,children:o.heading})}),
            (0,p.jsx)("p",{className:"page-sub",children:o.reasons}),
            (0,p.jsx)(d,{children:(0,p.jsx)("a",{className:"contact__email",href:"mailto:"+i.email,"data-cursor":"open",children:i.email})}),
            (0,p.jsxs)("ul",{
              className:"socials",
              children:[
                (0,p.jsx)("li",{children:(0,p.jsxs)("a",{href:i.links.github,target:"_blank",rel:"noreferrer",children:[(0,p.jsx)("span",{"aria-hidden":"true",children:"☁"})," GitHub"]})}),
                (0,p.jsx)("li",{children:(0,p.jsxs)("a",{href:i.links.linkedin,target:"_blank",rel:"noreferrer",children:[(0,p.jsx)("span",{"aria-hidden":"true",children:"✦"})," LinkedIn"]})}),
                (0,p.jsx)("li",{children:(0,p.jsxs)("a",{href:i.links.leetcode,target:"_blank",rel:"noreferrer",children:[(0,p.jsx)("span",{"aria-hidden":"true",children:"◈"})," LeetCode"]})}),
                (0,p.jsx)("li",{children:(0,p.jsxs)("a",{href:i.links.codechef,target:"_blank",rel:"noreferrer",children:[(0,p.jsx)("span",{"aria-hidden":"true",children:"★"})," CodeChef"]})}),
                (0,p.jsx)("li",{children:(0,p.jsxs)("a",{href:i.links.codeforces,target:"_blank",rel:"noreferrer",children:[(0,p.jsx)("span",{"aria-hidden":"true",children:"❖"})," Codeforces"]})}),
                (0,p.jsx)("li",{children:(0,p.jsxs)("a",{href:i.links.hackerrank,target:"_blank",rel:"noreferrer",children:[(0,p.jsx)("span",{"aria-hidden":"true",children:"⬢"})," HackerRank"]})})
              ]
            }),
            (0,p.jsx)("div",{className:"contact__sky","aria-hidden":"true"})
          ]
        }),
        (0,p.jsxs)("div",{
          className:"contact__form-wrap",
          children:[
            (0,p.jsx)("h2",{className:"contact__form-title",children:e.formTitle}),
            isSubmitted ? (0,p.jsxs)("div",{
              className:"contact__thanks",
              children:[
                (0,p.jsx)("p",{className:"contact__thanks-mark","aria-hidden":"true",children:"✈"}),
                (0,p.jsx)("p",{children:e.thanks}),
                (0,p.jsxs)("p",{
                  className:"muted",
                  children:[
                    "Delivered to ",
                    (0,p.jsx)("a",{href:"mailto:"+i.email,children:i.email}),
                    ". Sri Ram will get back to you shortly."
                  ]
                }),
                (0,p.jsx)("button",{type:"button",className:"btn btn--ghost",onClick:onReset,children:e.again})
              ]
            }) : (0,p.jsxs)("form",{
              ref:formRef,
              className:"form",
              onSubmit:onSubmit,
              noValidate:!0,
              children:[
                serverError && (0,p.jsx)("div",{
                  className:"field__error",
                  style:{
                    padding:".8rem 1rem",
                    background:"rgba(255, 107, 94, 0.12)",
                    border:"1px solid var(--coral)",
                    borderRadius:"var(--radius-sm)",
                    color:"var(--coral)",
                    marginBottom:".5rem"
                  },
                  role:"alert",
                  children:serverError
                }),
                renderField("name","Your name",{autoComplete:"name",maxLength:80}),
                renderField("email","Your email",{type:"email",autoComplete:"email",maxLength:120}),
                renderField("message","Message",{multiline:!0,rows:5,maxLength:g}),
                (0,p.jsx)("p",{className:"form__note",children:e.mailtoNote}),
                (0,p.jsx)(d,{
                  children:(0,p.jsxs)("button",{
                    type:"submit",
                    className:"btn btn--primary",
                    disabled:isSending,
                    style:isSending?{opacity:.7,cursor:"not-allowed"}:void 0,
                    children:[
                      isSending?"Sending...":e.send,
                      " ",
                      (0,p.jsx)("span",{"aria-hidden":"true",children:"✈"})
                    ]
                  })
                })
              ]
            }),
            (0,p.jsx)("p",{className:"sr-only","aria-live":"polite",children:announcement})
          ]
        })
      ]
    })
  });
}

export { y as default };
