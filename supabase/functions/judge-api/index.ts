import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    const { action, ...payload } = await req.json()

    if (action === 'login') {
      const { judge_code, password } = payload
      
      const { data: judge, error } = await supabase
        .from('judges')
        .select('*, competitions(*)')
        .eq('judge_code', judge_code)
        .eq('password', password)
        .single()

      if (error || !judge) {
        return new Response(JSON.stringify({ error: 'चुकीचा Judge ID किंवा पासवर्ड' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Check if competition is locked
      if ((judge as any).competitions?.is_locked) {
        return new Response(JSON.stringify({ error: 'ही स्पर्धा लॉक झाली आहे' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get entries for this competition
      const { data: entries } = await supabase
        .from('entries')
        .select('id, entry_code, image_url, class_category')
        .eq('competition_id', judge.competition_id)
        .order('entry_code')

      // Get existing scores by this judge
      const { data: existingScores } = await supabase
        .from('scores')
        .select('entry_id, score, remark')
        .eq('judge_id', judge.id)

      return new Response(JSON.stringify({ 
        judge: { id: judge.id, judge_code: judge.judge_code, name: judge.name, competition_id: judge.competition_id },
        competition: (judge as any).competitions,
        entries: entries || [],
        existingScores: existingScores || [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'submit_scores') {
      const { judge_id, scores } = payload

      const { data: judge } = await supabase
        .from('judges')
        .select('*, competitions(*)')
        .eq('id', judge_id)
        .single()

      if (!judge) {
        return new Response(JSON.stringify({ error: 'Judge सापडला नाही' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if ((judge as any).competitions?.is_locked) {
        return new Response(JSON.stringify({ error: 'ही स्पर्धा लॉक झाली आहे' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get already scored entry_ids by this judge
      const { data: alreadyScored } = await supabase
        .from('scores')
        .select('entry_id')
        .eq('judge_id', judge_id)

      const scoredSet = new Set((alreadyScored || []).map((s: any) => s.entry_id))

      // Filter out already scored entries to prevent duplicates
      const newScores = scores
        .filter((s: any) => !scoredSet.has(s.entry_id))
        .map((s: any) => ({
          judge_id,
          entry_id: s.entry_id,
          score: s.score,
          creativity_score: s.score,
          theme_score: s.score,
          neatness_score: s.score,
          remark: s.remark || null,
        }))

      if (newScores.length === 0) {
        return new Response(JSON.stringify({ success: true, message: 'कोणतेही नवीन गुण नाहीत' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { error: insertError } = await supabase
        .from('scores')
        .insert(newScores)

      if (insertError) {
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ success: true, message: 'मूल्यांकन यशस्वीरित्या सबमिट झाले!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
